import { ArrowUpLeft } from "lucide-react";
import type { heroScenes } from "./scenes";
import { ToolArtwork } from "./toolVisuals";

type Item = (typeof heroScenes)[number]["items"][number];

/** Every tool and studio has its own distinct illustrative SVG composition; real tools open via their links. */
export function ToolPreview({ item, ar }: { item: Item; ar: boolean }) {
  return (
    <div className="film-preview" data-tool={item.id}>
      <header dir={ar ? "rtl" : "ltr"}>
        <span>
          <item.icon size={14} />
          {ar ? item.ar : item.en}
        </span>
        <small>{ar ? "معاينة توضيحية" : "ILLUSTRATIVE PREVIEW"}</small>
      </header>
      <div className="film-preview-content" dir="ltr" aria-hidden="true">
        <ToolArtwork id={item.id} />
      </div>
      <footer dir={ar ? "rtl" : "ltr"}>
        <span>
          <i />
          {ar
            ? "معاينة مخصصة لهذه الأداة"
            : "Unique preview for this tool"}
        </span>
        <ArrowUpLeft size={12} />
      </footer>
    </div>
  );
}
