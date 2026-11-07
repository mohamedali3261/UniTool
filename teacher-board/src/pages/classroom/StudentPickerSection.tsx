import React, { useState } from 'react';
import { Shuffle, UserPlus, RotateCcw, X } from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const StudentPickerSection: React.FC = () => {
  const { isAr, classroom, updateClassroom } = useBoard();
  const [newName, setNewName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const pickStudent = () => {
    const available = classroom.noRepeatPick
      ? classroom.students.filter((s) => !classroom.pickedHistory.includes(s))
      : classroom.students;
    const pool = available.length > 0 ? available : classroom.students;
    if (pool.length === 0) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setSelectedStudent(chosen);
    updateClassroom((c) => ({
      ...c,
      pickedHistory: available.length > 0 ? [...c.pickedHistory, chosen] : [chosen],
    }));
  };

  const addStudent = () => {
    const clean = newName.trim();
    if (!clean) return;
    updateClassroom((c) => ({
      ...c,
      students: c.students.includes(clean) ? c.students : [...c.students, clean],
    }));
    setNewName('');
  };

  return (
    <section className="tb-card tb-tool-module" data-testid="tb-student-picker-section">
      <div className="tb-module-head">
        <div className="tb-module-title">
          <Shuffle size={18} />
          <h2>{isAr ? 'الاختيار العشوائي للطلاب' : 'Random Student Picker'}</h2>
        </div>
        <label className="tb-check-label">
          <input
            type="checkbox"
            checked={classroom.noRepeatPick}
            onChange={(e) =>
              updateClassroom((c) => ({ ...c, noRepeatPick: e.target.checked }))
            }
          />
          <span>{isAr ? 'بدون تكرار' : 'No repeat'}</span>
        </label>
      </div>

      <div className="tb-student-spotlight" data-testid="tb-picked-student">
        {selectedStudent || (isAr ? 'اضغط لاختيار طالب للمشاركة' : 'Click Pick to select a student')}
      </div>

      <div className="tb-module-actions">
        <button type="button" onClick={pickStudent} className="tb-btn tb-btn--primary">
          <Shuffle size={15} />
          <span>{isAr ? 'اختيار طالب عشوائي' : 'Pick Random Student'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedStudent(null);
            updateClassroom((c) => ({ ...c, pickedHistory: [] }));
          }}
          className="tb-btn tb-btn--ghost"
        >
          <RotateCcw size={14} />
          <span>{isAr ? 'تصفير الدور' : 'Reset Round'}</span>
        </button>
      </div>

      <div className="tb-formula-input-row">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          placeholder={isAr ? 'أضف اسم طالب للقائمة…' : 'Add student name…'}
          className="tb-input"
        />
        <button type="button" onClick={addStudent} className="tb-btn tb-btn--ghost">
          <UserPlus size={15} />
        </button>
      </div>

      <div className="tb-student-tags">
        {classroom.students.map((st) => {
          const picked = classroom.pickedHistory.includes(st);
          return (
            <span key={st} className={`tb-student-tag ${picked ? 'is-picked' : ''}`}>
              {st}
              <button
                type="button"
                onClick={() =>
                  updateClassroom((c) => ({
                    ...c,
                    students: c.students.filter((x) => x !== st),
                  }))
                }
                aria-label={`${isAr ? 'حذف' : 'Remove'} ${st}`}
              >
                <X size={11} />
              </button>
            </span>
          );
        })}
      </div>
    </section>
  );
};
