export type MotionFrame = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};
export type MotionDefinition = {
  id: string;
  name: string;
  category: "entry" | "exit" | "loop" | "camera";
  sample: (progress: number) => MotionFrame;
};
export const frame = (patch: Partial<MotionFrame>): MotionFrame => ({
  x: 0,
  y: 0,
  scale: 1,
  opacity: 1,
  ...patch,
});
export const unit = (p: number) => Math.max(0, Math.min(1, p));
