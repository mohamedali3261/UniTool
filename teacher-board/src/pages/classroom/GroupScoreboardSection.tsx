import React from 'react';
import { Trophy, Plus, Minus, RotateCcw } from 'lucide-react';
import { uid } from '../../core/storage';
import { useBoard } from '../../app/BoardContext';

export const GroupScoreboardSection: React.FC = () => {
  const { isAr, classroom, updateClassroom } = useBoard();
  const topScore = Math.max(0, ...classroom.teams.map((t) => t.score));

  const adjustScore = (id: string, delta: number) => {
    updateClassroom((c) => ({
      ...c,
      teams: c.teams.map((t) =>
        t.id === id ? { ...t, score: Math.max(0, t.score + delta) } : t
      ),
    }));
  };

  const addTeam = () => {
    const idx = classroom.teams.length + 1;
    updateClassroom((c) => ({
      ...c,
      teams: [
        ...c.teams,
        {
          id: uid('team'),
          name: isAr ? `المجموعة ${idx}` : `Team ${idx}`,
          score: 0,
          color: '#7c3aed',
        },
      ],
    }));
  };

  return (
    <section className="tb-card tb-tool-module" data-testid="tb-scoreboard-section">
      <div className="tb-module-head">
        <div className="tb-module-title">
          <Trophy size={18} />
          <h2>{isAr ? 'لوحة نقاط المجموعات التنافسية' : 'Team Scoreboard'}</h2>
        </div>
        <div className="tb-module-actions">
          <button type="button" onClick={addTeam} className="tb-btn tb-btn--ghost">
            <Plus size={14} />
            <span>{isAr ? 'مجموعة' : 'Add Team'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              updateClassroom((c) => ({
                ...c,
                teams: c.teams.map((t) => ({ ...t, score: 0 })),
              }))
            }
            className="tb-btn tb-btn--ghost"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="tb-teams-list">
        {classroom.teams.map((team) => {
          const isLeader = topScore > 0 && team.score === topScore;
          return (
            <div
              key={team.id}
              className={`tb-team-card ${isLeader ? 'is-leader' : ''}`}
            >
              <input
                type="text"
                value={team.name}
                onChange={(e) =>
                  updateClassroom((c) => ({
                    ...c,
                    teams: c.teams.map((t) =>
                      t.id === team.id ? { ...t, name: e.target.value } : t
                    ),
                  }))
                }
                className="tb-team-name-input"
              />
              <div className="tb-team-score-controls">
                <button type="button" onClick={() => adjustScore(team.id, -1)} className="tb-sym-btn">
                  <Minus size={13} />
                </button>
                <strong className="tb-team-score-val">{team.score}</strong>
                <button type="button" onClick={() => adjustScore(team.id, 1)} className="tb-sym-btn">
                  +1
                </button>
                <button type="button" onClick={() => adjustScore(team.id, 5)} className="tb-sym-btn">
                  +5
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
