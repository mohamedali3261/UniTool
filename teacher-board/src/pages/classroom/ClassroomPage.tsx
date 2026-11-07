import React from 'react';
import { useBoard } from '../../app/BoardContext';
import { ClassTimerSection } from './ClassTimerSection';
import { DiceAndCalcSection } from './DiceAndCalcSection';
import { GroupScoreboardSection } from './GroupScoreboardSection';
import { StudentPickerSection } from './StudentPickerSection';

export const ClassroomPage: React.FC = () => {
  const { isAr } = useBoard();

  return (
    <main className="tb-page-container" data-testid="tb-classroom-page">
      <header className="tb-page-hero">
        <div>
          <h1>{isAr ? 'أدوات تفاعل وإدارة الفصل' : 'Interactive Classroom Management Suite'}</h1>
          <p>
            {isAr
              ? 'كل ما يحتاجه المعلم لتنشيط الحصة: مؤقت أنشطة، قرعة طلاب عادلة، نقاط المجموعات، وحاسبة علمية.'
              : 'Engage your students with an activity timer, fair random student picker, team scoreboard, and probability tools.'}
          </p>
        </div>
      </header>

      <div className="tb-classroom-grid">
        <ClassTimerSection />
        <StudentPickerSection />
        <GroupScoreboardSection />
        <DiceAndCalcSection />
      </div>
    </main>
  );
};
