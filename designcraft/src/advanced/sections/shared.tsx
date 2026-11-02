import type { ReactNode } from "react";
import type { fabric } from "fabric";
import type { ProjectItem } from "../../types";
export interface Props {
  canvas: fabric.Canvas;
  project: ProjectItem;
  ar: boolean;
  run: (fn: () => void | Promise<void>, edit?: boolean) => void;
  revision: number;
}
export const t = (ar: boolean, a: string, b: string) => (ar ? a : b);
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="adv-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Note({ children }: { children: ReactNode }) {
  return <p className="adv-note">{children}</p>;
}
