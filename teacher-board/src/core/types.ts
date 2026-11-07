export type Lang = 'ar' | 'en';

export type StudioRoute = 'board' | 'templates' | 'classroom' | 'lessons';

export type BoardSurface = 'white' | 'chalk-green' | 'blackboard' | 'sepia';

export type BoardGrid =
  | 'plain'
  | 'lined'
  | 'grid'
  | 'axes'
  | 'dots'
  | 'english-4line'
  | 'music';

export type ToolId =
  | 'select'
  | 'pan'
  | 'pen'
  | 'calligraphy'
  | 'highlighter'
  | 'dashed'
  | 'laser'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'number-line'
  | 'axes-shape'
  | 'text'
  | 'sticky';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeItem {
  id: string;
  kind: 'stroke';
  style: 'pen' | 'calligraphy' | 'highlighter' | 'dashed';
  color: string;
  size: number;
  points: Point[];
}

export interface ShapeItem {
  id: string;
  kind: 'shape';
  shapeType:
    | 'line'
    | 'arrow'
    | 'rect'
    | 'circle'
    | 'triangle'
    | 'number-line'
    | 'axes-shape';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fill?: string;
  strokeWidth: number;
}

export interface TextItem {
  id: string;
  kind: 'text' | 'sticky' | 'formula' | 'stamp';
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  bgColor?: string;
  fontSize: number;
}

export interface ImageBoardItem {
  id: string;
  kind: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string;
}

export type BoardElement = StrokeItem | ShapeItem | TextItem | ImageBoardItem;

export interface LaserTrail {
  id: string;
  points: { x: number; y: number; t: number }[];
}

export interface GeometryToolState {
  ruler: { visible: boolean; x: number; y: number; angle: number; lengthPx: number };
  protractor: { visible: boolean; x: number; y: number; angle: number; measureDeg: number };
  setSquare: { visible: boolean; x: number; y: number; angle: number };
}

export interface OverlayState {
  spotlight: boolean;
  curtain: boolean;
  curtainRatio: number; // 0.15 .. 0.92
  splitBoard: boolean;
  focusMode: boolean;
}

export interface BoardSlide {
  id: string;
  title: string;
  surface: BoardSurface;
  grid: BoardGrid;
  elements: BoardElement[];
  splitElements: BoardElement[];
}

export type SubjectCategory =
  | 'all'
  | 'math'
  | 'science'
  | 'arabic'
  | 'english'
  | 'social'
  | 'planning';

export interface LessonDocument {
  id: string;
  title: string;
  subject: Exclude<SubjectCategory, 'all'>;
  grade: string;
  updatedAt: number;
  slides: BoardSlide[];
}

export interface TeamScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface ClassroomState {
  students: string[];
  pickedHistory: string[];
  noRepeatPick: boolean;
  teams: TeamScore[];
  timerSeconds: number;
}
