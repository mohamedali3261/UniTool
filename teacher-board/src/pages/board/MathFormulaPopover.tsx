import React, { useRef, useState } from 'react';
import { ImagePlus, Calculator } from 'lucide-react';
import {
  FORMULA_PRESETS,
  QUICK_MATH_SYMBOLS,
  TEACHER_STAMPS,
} from '../../data/mathScienceSymbols';
import { uid } from '../../core/storage';
import { useBoard } from '../../app/BoardContext';

export const MathFormulaPopover: React.FC = () => {
  const { isAr, addBoardElement, setOpenPopover } = useBoard();
  const [customExpr, setCustomExpr] = useState('');
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const insertFormula = (expression: string) => {
    if (!expression.trim()) return;
    const maxW = typeof window !== 'undefined' ? Math.min(370, window.innerWidth - 52) : 370;
    const startX = typeof window !== 'undefined' && window.innerWidth < 680 ? 20 : 320 + Math.round(Math.random() * 50);
    addBoardElement({
      id: uid('formula'),
      kind: 'formula',
      x: startX,
      y: 150 + Math.round(Math.random() * 50),
      w: maxW,
      h: 66,
      text: expression.trim(),
      color: '#14532d',
      bgColor: '#f0fdf4',
      fontSize: typeof window !== 'undefined' && window.innerWidth < 680 ? 17 : 20,
    });
    setOpenPopover(null);
  };

  const insertStamp = (text: string, color: string, bgColor: string) => {
    const maxW = typeof window !== 'undefined' ? Math.min(240, window.innerWidth - 56) : 240;
    const startX = typeof window !== 'undefined' && window.innerWidth < 680 ? 40 : 380 + Math.round(Math.random() * 60);
    addBoardElement({
      id: uid('stamp'),
      kind: 'stamp',
      x: startX,
      y: 130 + Math.round(Math.random() * 60),
      w: maxW,
      h: 50,
      text,
      color,
      bgColor,
      fontSize: 17,
    });
    setOpenPopover(null);
  };

  const runQuickCalc = () => {
    try {
      const sanitized = calcInput
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized.trim()) return;
      const val = Function(`"use strict"; return (${sanitized});`)();
      if (typeof val === 'number' && Number.isFinite(val)) {
        setCalcResult(Number(val.toFixed(6)).toString());
      } else {
        setCalcResult(isAr ? 'خطأ' : 'Err');
      }
    } catch {
      setCalcResult(isAr ? 'خطأ' : 'Err');
    }
  };

  const onImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addBoardElement({
          id: uid('img'),
          kind: 'image',
          x: 320,
          y: 140,
          w: 360,
          h: 260,
          dataUrl: reader.result,
        });
        setOpenPopover(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="tb-popover tb-popover--wide" data-testid="tb-insert-popover">
      {/* 1. Custom Formula / Symbol Builder */}
      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'كتابة معادلة أو رمز علمي سريع' : 'Insert Math / Science Equation'}
        </span>
        <div className="tb-formula-input-row">
          <input
            type="text"
            dir="ltr"
            value={customExpr}
            onChange={(e) => setCustomExpr(e.target.value)}
            placeholder="e.g. f(x) = x² + 2x - 3"
            className="tb-input"
          />
          <button
            type="button"
            onClick={() => insertFormula(customExpr)}
            className="tb-btn tb-btn--primary"
          >
            {isAr ? 'إدراج' : 'Insert'}
          </button>
        </div>
        <div className="tb-symbol-grid">
          {QUICK_MATH_SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => setCustomExpr((prev) => prev + sym)}
              className="tb-sym-btn"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Ready Laws & Formulas */}
      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'قوانين جاهزة بضغطة زر' : 'Ready Classroom Laws'}
        </span>
        <div className="tb-chip-wrap">
          {FORMULA_PRESETS.slice(0, 8).map((fp) => (
            <button
              key={fp.id}
              type="button"
              onClick={() => insertFormula(fp.expression)}
              className="tb-pill-chip"
              title={fp.expression}
            >
              {isAr ? fp.labelAr : fp.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Teacher Feedback Stamps & Image Upload */}
      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'أختام تشجيعية وصور توضيحية' : 'Teacher Stamps & Diagrams'}
        </span>
        <div className="tb-chip-wrap">
          {TEACHER_STAMPS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => insertStamp(isAr ? st.textAr : st.textEn, st.color, st.bg)}
              className="tb-pill-chip"
            >
              {isAr ? st.textAr : st.textEn}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="tb-pill-chip"
          >
            <ImagePlus size={13} />
            <span>{isAr ? 'صورة من الجهاز' : 'Upload Image'}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onImagePicked}
          />
        </div>
      </div>

      {/* 4. Mini Quick Calculator */}
      <div className="tb-popover__section">
        <div className="tb-formula-input-row">
          <Calculator size={15} />
          <input
            type="text"
            dir="ltr"
            value={calcInput}
            onChange={(e) => setCalcInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runQuickCalc()}
            placeholder={isAr ? 'حاسبة سريعة: (12 * 5) / 2' : 'Quick calc: (12 * 5) / 2'}
            className="tb-input"
          />
          <button type="button" onClick={runQuickCalc} className="tb-btn tb-btn--ghost">
            =
          </button>
          {calcResult !== null && (
            <button
              type="button"
              onClick={() => insertFormula(`${calcInput} = ${calcResult}`)}
              className="tb-btn tb-btn--primary"
              title={isAr ? 'إدراج الناتج على السبورة' : 'Insert result on board'}
            >
              {calcResult}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
