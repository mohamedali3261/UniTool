import { RotateCcw } from "lucide-react";
export function StatusBar({
  saved,
  ar,
  onNew,
}: {
  saved: string;
  ar: boolean;
  onNew: () => void;
}) {
  return (
    <footer className="ps-footer">
      <span>
        <span className="ps-dot" />
        {saved}
      </span>
      <span>
        PRODUCT STUDIO <b> / </b> UNITOOL
      </span>
      <button onClick={onNew}>
        <RotateCcw size={13} />
        {ar ? "مشروع جديد" : "New project"}
      </button>
    </footer>
  );
}
