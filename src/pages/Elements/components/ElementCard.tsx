import { Heart, ArrowUpLeft } from "lucide-react";
import type { LibraryElement } from "../types";
import { ElementPreview } from "./ElementPreview";
export function ElementCard({
  live = true,
  item,
  favorite,
  onFavorite,
  onOpen,
}: {
  live?: boolean;
  item: LibraryElement;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="element-card">
      <button
        className="element-card-preview"
        onClick={onOpen}
        aria-label={`فتح ${item.name}`}
      >
        <ElementPreview live={live && item.animated} item={item} />
        <span>
          {item.kind === "group"
            ? "تكوين جاهز قابل للتعديل"
            : item.kind === "layer"
              ? "طبقة قابلة للتعديل"
              : item.kind === "svg"
                ? "SVG متجهي"
                : "مشهد بالكود"}
        </span>
      </button>
      <div className="element-card-info">
        <small>
          {item.sourceName}
          {item.animated ? " · حركة" : ""}
        </small>
        <h3>
          <button onClick={onOpen}>{item.name}</button>
        </h3>
        <div>
          <button
            className="element-favorite"
            aria-label={`مفضلة ${item.name}`}
            aria-pressed={favorite}
            onClick={onFavorite}
          >
            <Heart size={17} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button className="element-inspect" onClick={onOpen}>
            تفاصيل وإضافة
            <ArrowUpLeft size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
