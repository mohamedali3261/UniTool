export interface FormulaPreset {
  id: string;
  category: 'math' | 'geometry' | 'physics' | 'chemistry';
  labelAr: string;
  labelEn: string;
  expression: string;
}

export const FORMULA_PRESETS: FormulaPreset[] = [
  { id: 'quad', category: 'math', labelAr: 'القانون العام', labelEn: 'Quadratic Formula', expression: 'x = (-b ± √(b² - 4ac)) ÷ 2a' },
  { id: 'pyth', category: 'geometry', labelAr: 'نظرية فيثاغورس', labelEn: 'Pythagorean Theorem', expression: 'أ² + ب² = جـ²   |   a² + b² = c²' },
  { id: 'circle-area', category: 'geometry', labelAr: 'مساحة ومحيط الدائرة', labelEn: 'Circle Area & Circumference', expression: 'م = π نق²   |   المحيط = 2 π نق' },
  { id: 'trig', category: 'math', labelAr: 'متطابقة مثلثية', labelEn: 'Trig Identity', expression: 'sin²(θ) + cos²(θ) = 1' },
  { id: 'slope', category: 'math', labelAr: 'ميل الخط المستقيم', labelEn: 'Line Slope', expression: 'm = (y₂ - y₁) ÷ (x₂ - x₁)' },
  { id: 'deriv', category: 'math', labelAr: 'مشتقة وتكامل', labelEn: 'Derivative & Integral', expression: 'd/dx (xⁿ) = n·xⁿ⁻¹   |   ∫ xⁿ dx = xⁿ⁺¹/(n+1)' },
  { id: 'newton', category: 'physics', labelAr: 'قانون نيوتن الثاني', labelEn: 'Newton Second Law', expression: 'F = m · a   (القوة = الكتلة × العجلة)' },
  { id: 'ohm', category: 'physics', labelAr: 'قانون أوم الكهربائي', labelEn: "Ohm's Law", expression: 'V = I × R   (الجهد = التيار × المقاومة)' },
  { id: 'speed', category: 'physics', labelAr: 'السرعة والمسافة', labelEn: 'Speed Formula', expression: 'ع = ف ÷ ز   |   v = d ÷ t' },
  { id: 'energy', category: 'physics', labelAr: 'طاقة الحركة', labelEn: 'Kinetic Energy', expression: 'KE = ½ m v²' },
  { id: 'water', category: 'chemistry', labelAr: 'تكوين الماء', labelEn: 'Water Synthesis', expression: '2H₂ + O₂ → 2H₂O' },
  { id: 'photo', category: 'chemistry', labelAr: 'البناء الضوئي', labelEn: 'Photosynthesis', expression: '6CO₂ + 6H₂O + ضوء → C₆H₁₂O₆ + 6O₂' },
];

export const QUICK_MATH_SYMBOLS = [
  '±', '×', '÷', '√', '∛', 'π', '∞', '≈', '≠', '≤', '≥',
  '∑', '∫', 'Δ', 'θ', 'α', 'β', '°', '∠', '⊥', '∥', '→', '⇌',
  '²', '³', '½', '¼', '¾',
];

export interface TeacherStamp {
  id: string;
  textAr: string;
  textEn: string;
  color: string;
  bg: string;
}

export const TEACHER_STAMPS: TeacherStamp[] = [
  { id: 'excellent', textAr: '⭐ ممتاز أحسنت!', textEn: '⭐ Excellent Work!', color: '#14532d', bg: '#dcfce7' },
  { id: 'important', textAr: '📌 قاعدة مهمة للامتحان', textEn: '📌 Key Exam Rule', color: '#7c2d12', bg: '#ffedd5' },
  { id: 'homework', textAr: '📚 واجب منزلي', textEn: '📚 Homework Task', color: '#1e3a8a', bg: '#dbeafe' },
  { id: 'think', textAr: '💡 سؤال تفكير ذكي', textEn: '💡 Challenge Question', color: '#581c87', bg: '#f3e8ff' },
  { id: 'check', textAr: '✓ إجابة صحيحة', textEn: '✓ Correct Step', color: '#166534', bg: '#dcfce7' },
  { id: 'review', textAr: '⚠ راجع الإشارة / الخطوة', textEn: '⚠ Check This Step', color: '#991b1b', bg: '#fee2e2' },
];
