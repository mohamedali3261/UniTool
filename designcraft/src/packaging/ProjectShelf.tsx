import React, { useState } from "react";
import { FolderOpen, Search, Trash2 } from "lucide-react";
import type { ProjectItem } from "../types";
import { useDcLang } from "../hooks/useDcLang";
import { CardPhoto } from "./CardPhoto";
import { formatCartonDims, type PackagingUnit } from "./units";

export function ProjectShelf({
  projects,
  unit = "cm",
  onOpen,
  onDelete,
}: {
  projects: ProjectItem[];
  unit?: PackagingUnit;
  onOpen: (p: ProjectItem) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    [query, setQuery] = useState("");
  const filtered = projects
    .filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt),
    );
  return (
    <section className="packaging-projects" data-testid="packaging-projects">
      <header>
        <h2>
          <FolderOpen size={17} />
          {ar ? "مشاريع هذا القسم" : "Projects in this section"}{" "}
          <span>{projects.length}</span>
        </h2>
        <label className="packaging-search">
          <Search size={15} />
          <input
            aria-label={ar ? "بحث في مشاريع القسم" : "Search section projects"}
            type="search"
            placeholder={ar ? "ابحث في مشاريعك…" : "Find your project…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </header>
      {filtered.length ? (
        <div className="packaging-catalog-grid">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="packaging-template"
              data-section-project={p.id}
            >
              <button
                type="button"
                className="packaging-template-preview"
                onClick={() => onOpen(p)}
                aria-label={(ar ? "فتح " : "Open ") + p.title}
              >
                {p.packaging ? (
                  <CardPhoto
                    thumbnail={p.thumbnail}
                    source={{
                      key: `saved-${p.id}-${p.updatedAt}`,
                      size: p.packaging.size,
                      canvasData: p.canvasData,
                    }}
                  />
                ) : p.thumbnail ? (
                  <img src={p.thumbnail} alt="" loading="lazy" />
                ) : (
                  <FolderOpen size={35} />
                )}
                <span>{ar ? "متابعة التصميم" : "Continue designing"}</span>
              </button>
              <div className="packaging-template-meta">
                <div>
                  <h3>
                    <button type="button" onClick={() => onOpen(p)}>
                      {p.title}
                    </button>
                  </h3>
                  {p.packaging && (
                    <small className="packaging-project-dims" dir="ltr">
                      {formatCartonDims(p.packaging.size, unit, ar)}
                    </small>
                  )}
                  <time>
                    {new Date(p.updatedAt || p.createdAt).toLocaleDateString(
                      ar ? "ar-EG" : "en-US",
                    )}
                  </time>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    className="packaging-project-delete"
                    aria-label={(ar ? "حذف " : "Delete ") + p.title}
                    onClick={(e) => onDelete(p.id, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="packaging-projects-empty">
          {ar
            ? "مشاريعك في هذا القسم هتظهر هنا."
            : "Your projects in this section will appear here."}
        </div>
      )}
    </section>
  );
}
