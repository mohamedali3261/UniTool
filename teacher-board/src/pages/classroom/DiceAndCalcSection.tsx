import React, { useState } from 'react';
import { Dices, Calculator } from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const DiceAndCalcSection: React.FC = () => {
  const { isAr } = useBoard();
  const [diceVal, setDiceVal] = useState(6);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [expr, setExpr] = useState('');
  const [ans, setAns] = useState('0');

  const evaluateSci = () => {
    try {
      const prepared = expr
        .replace(/π/g, String(Math.PI))
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(');
      if (!/^[0-9+\-*/().,\sMathsincoqrtPI]+$/.test(prepared)) {
        setAns(isAr ? 'خطأ' : 'Error');
        return;
      }
      const out = Function(`"use strict"; return (${prepared});`)();
      setAns(Number.isFinite(out) ? String(Number(out.toFixed(6))) : 'Error');
    } catch {
      setAns(isAr ? 'خطأ' : 'Error');
    }
  };

  return (
    <section className="tb-card tb-tool-module" data-testid="tb-dice-calc-section">
      <div className="tb-module-head">
        <div className="tb-module-title">
          <Dices size={18} />
          <h2>{isAr ? 'حجر النرد والآلة الحاسبة العلمية' : 'Probability Dice & Scientific Calculator'}</h2>
        </div>
      </div>

      <div className="tb-dice-coin-row">
        <div className="tb-dice-box">
          <span className="tb-dice-face" data-testid="tb-dice-value">{diceVal}</span>
          <button
            type="button"
            onClick={() => setDiceVal(1 + Math.floor(Math.random() * 6))}
            className="tb-btn tb-btn--primary"
          >
            {isAr ? 'رمي النرد' : 'Roll Dice'}
          </button>
        </div>

        <div className="tb-dice-box">
          <span className="tb-coin-face">
            {coinSide === 'heads' ? (isAr ? 'صورة' : 'Heads') : isAr ? 'كتابة' : 'Tails'}
          </span>
          <button
            type="button"
            onClick={() => setCoinSide(Math.random() > 0.5 ? 'heads' : 'tails')}
            className="tb-btn tb-btn--ghost"
          >
            {isAr ? 'رمي العملة' : 'Flip Coin'}
          </button>
        </div>
      </div>

      <div className="tb-sci-calc">
        <div className="tb-formula-input-row">
          <Calculator size={16} />
          <input
            type="text"
            dir="ltr"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && evaluateSci()}
            placeholder="sqrt(25) + 3 * 4"
            className="tb-input"
          />
          <button type="button" onClick={evaluateSci} className="tb-btn tb-btn--primary">
            =
          </button>
          <strong className="tb-calc-ans" dir="ltr">{ans}</strong>
        </div>
        <div className="tb-chip-wrap">
          {['sin(', 'cos(', 'tan(', 'sqrt(', 'π', '(', ')', ' + ', ' - ', ' * ', ' / '].map((tok) => (
            <button
              key={tok}
              type="button"
              onClick={() => setExpr((p) => p + tok)}
              className="tb-sym-btn"
            >
              {tok.trim()}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
