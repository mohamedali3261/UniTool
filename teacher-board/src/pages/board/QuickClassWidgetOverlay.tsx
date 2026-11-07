import React, { useEffect, useState } from 'react';
import { Timer, Shuffle, Trophy, Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react';
import { playClassroomChime } from '../../core/exporter';
import { useBoard } from '../../app/BoardContext';

export const QuickClassWidgetOverlay: React.FC = () => {
  const { isAr, quickWidget, setQuickWidget, classroom, updateClassroom } = useBoard();
  const [remaining, setRemaining] = useState(classroom.timerSeconds || 180);
  const [running, setRunning] = useState(false);
  const [pickedStudent, setPickedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playClassroomChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (!quickWidget) return null;

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');

  const pickRandom = () => {
    const pool = classroom.noRepeatPick
      ? classroom.students.filter((s) => !classroom.pickedHistory.includes(s))
      : classroom.students;
    const effective = pool.length > 0 ? pool : classroom.students;
    if (effective.length === 0) return;
    const winner = effective[Math.floor(Math.random() * effective.length)];
    setPickedStudent(winner);
    updateClassroom((c) => ({
      ...c,
      pickedHistory: pool.length > 0 ? [...c.pickedHistory, winner] : [winner],
    }));
  };

  return (
    <aside className="tb-floating-widget" data-testid="tb-quick-widget">
      <div className="tb-floating-widget__tabs">
        <button
          type="button"
          onClick={() => setQuickWidget('timer')}
          className={quickWidget === 'timer' ? 'is-active' : ''}
        >
          <Timer size={13} />
          <span>{isAr ? 'مؤقت' : 'Timer'}</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickWidget('picker')}
          className={quickWidget === 'picker' ? 'is-active' : ''}
        >
          <Shuffle size={13} />
          <span>{isAr ? 'قرعة' : 'Picker'}</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickWidget('scores')}
          className={quickWidget === 'scores' ? 'is-active' : ''}
        >
          <Trophy size={13} />
          <span>{isAr ? 'نقاط' : 'Scores'}</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickWidget(null)}
          aria-label={isAr ? 'إغلاق الأداة' : 'Close widget'}
        >
          <X size={13} />
        </button>
      </div>

      {quickWidget === 'timer' && (
        <div className="tb-floating-widget__body">
          <div className="tb-timer-readout" dir="ltr">
            {mins}:{secs}
          </div>
          <div className="tb-widget-row">
            {[60, 180, 300].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setRunning(false);
                  setRemaining(sec);
                }}
                className="tb-sym-btn"
              >
                {sec / 60}m
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="tb-btn tb-btn--primary"
            >
              {running ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setRemaining(180);
              }}
              className="tb-btn tb-btn--ghost"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}

      {quickWidget === 'picker' && (
        <div className="tb-floating-widget__body">
          <div className="tb-picked-banner">
            {pickedStudent || (isAr ? 'اضغط لاختيار طالب عشوائياً' : 'Click to pick a student')}
          </div>
          <button type="button" onClick={pickRandom} className="tb-btn tb-btn--primary w-full">
            <Shuffle size={14} />
            <span>{isAr ? 'اختيار طالب الآن' : 'Pick Student'}</span>
          </button>
        </div>
      )}

      {quickWidget === 'scores' && (
        <div className="tb-floating-widget__body">
          {classroom.teams.map((team) => (
            <div key={team.id} className="tb-mini-team-row">
              <span className="tb-mini-team-name">{team.name}</span>
              <div className="tb-mini-team-controls">
                <button
                  type="button"
                  onClick={() =>
                    updateClassroom((c) => ({
                      ...c,
                      teams: c.teams.map((t) =>
                        t.id === team.id ? { ...t, score: Math.max(0, t.score - 1) } : t
                      ),
                    }))
                  }
                >
                  <Minus size={11} />
                </button>
                <b>{team.score}</b>
                <button
                  type="button"
                  onClick={() =>
                    updateClassroom((c) => ({
                      ...c,
                      teams: c.teams.map((t) =>
                        t.id === team.id ? { ...t, score: t.score + 1 } : t
                      ),
                    }))
                  }
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
