import React, { useEffect, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { playClassroomChime } from '../../core/exporter';
import { useBoard } from '../../app/BoardContext';

export const ClassTimerSection: React.FC = () => {
  const { isAr, classroom, updateClassroom } = useBoard();
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [seconds, setSeconds] = useState(classroom.timerSeconds || 300);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'stopwatch') return prev + 1;
        if (prev <= 1) {
          setRunning(false);
          playClassroomChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  const applyPreset = (sec: number) => {
    setRunning(false);
    setMode('countdown');
    setSeconds(sec);
    updateClassroom((c) => ({ ...c, timerSeconds: sec }));
  };

  return (
    <section className="tb-card tb-tool-module" data-testid="tb-class-timer-section">
      <div className="tb-module-head">
        <div className="tb-module-title">
          <Timer size={18} />
          <h2>{isAr ? 'مؤقت الأنشطة وساعة الإيقاف' : 'Activity Timer & Stopwatch'}</h2>
        </div>
        <div className="tb-segmented">
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setMode('countdown');
              setSeconds(classroom.timerSeconds || 300);
            }}
            className={mode === 'countdown' ? 'is-active' : ''}
          >
            {isAr ? 'تنازلي' : 'Countdown'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setMode('stopwatch');
              setSeconds(0);
            }}
            className={mode === 'stopwatch' ? 'is-active' : ''}
          >
            {isAr ? 'تصاعدي' : 'Stopwatch'}
          </button>
        </div>
      </div>

      <div className="tb-big-clock" dir="ltr" data-testid="tb-timer-display">
        {mins}:{secs}
      </div>

      {mode === 'countdown' && (
        <div className="tb-chip-wrap justify-center">
          {[60, 180, 300, 600, 900].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => applyPreset(sec)}
              className="tb-pill-chip"
            >
              {sec / 60} {isAr ? 'دقائق' : 'min'}
            </button>
          ))}
        </div>
      )}

      <div className="tb-module-actions">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="tb-btn tb-btn--primary"
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          <span>{running ? (isAr ? 'إيقاف مؤقت' : 'Pause') : isAr ? 'بدء' : 'Start'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setSeconds(mode === 'stopwatch' ? 0 : classroom.timerSeconds || 300);
          }}
          className="tb-btn tb-btn--ghost"
        >
          <RotateCcw size={15} />
          <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
        </button>

        <button
          type="button"
          onClick={playClassroomChime}
          className="tb-btn tb-btn--ghost"
          title={isAr ? 'جرس تنبيه هادئ للفصل' : 'Gentle class bell'}
        >
          <Bell size={15} />
          <span>{isAr ? 'جرس الفصل' : 'Bell'}</span>
        </button>
      </div>
    </section>
  );
};
