import { CreativeControls } from "../creative/CreativeControls";
import { VectorPathEditor } from "./VectorPathEditor";
import { LayerMotionEditor } from "../animation/LayerMotionEditor";
import "./elements.css";
import { useEffect, useState } from "react";
import { TextPresetCatalog } from "./TextPresetCatalog";
import { textPresets } from "./presets";
import type { TextPresetStyle } from "./presets/types";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { TextMotionControls } from "../animation/TextMotionControls";
import { StudioSelect } from "../components/StudioSelect";
import { durationOf, type Project, type TextLayer } from "../types";
const swatches = [
  "#ffffff",
  "#b7f568",
  "#ffd166",
  "#ff8fab",
  "#83c5ff",
  "#000000",
];
export function TextPanel({
  project,
  selectedId,
  onSelect,
  onAdd,
  onChange,
  onRemove,
  onDuplicate,
  onInline,
  suspended = false,
}: {
  project: Project;
  suspended?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (s: string, style?: TextPresetStyle) => void;
  onChange: (id: string, patch: Partial<TextLayer>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onInline: (id: string) => void;
}) {
  const [mode, setMode] = useState<"edit" | "templates">(
    project.texts.length ? "edit" : "templates",
  );
  useEffect(() => {
    if (selectedId) setMode("edit");
  }, [selectedId]);
  const raw =
    project.texts.find((t) => t.id === selectedId) || project.texts[0];
  const active = raw
    ? { ...raw, locked: raw.locked || project.tracks?.text?.locked }
    : undefined;
  const edit = (patch: Partial<TextLayer>) => {
    if (active && !active.locked) onChange(active.id, patch);
  };
  return (
    <section className="simple-text-panel" aria-label="محرر النصوص المبسط">
      <button
        className="primary full-width"
        disabled={!project.clips.length}
        onClick={() => {
          onAdd("اكتب حكايتك هنا");
          setMode("edit");
        }}
      >
        + إضافة نص
      </button>
      <button
        className="full-width"
        disabled={!project.clips.length}
        onClick={() => {
          onAdd("", {
            x: 50,
            y: 50,
            size: 32,
            color: "#ffffff",
            name: "شكل جديد",
            background: "#8271ec",
            box: { width: 480, height: 260, radius: 32 },
          });
          setMode("edit");
        }}
      >
        + إضافة شكل قابل للتعديل
      </button>
      <div
        className="text-panel-modes"
        role="group"
        aria-label="طريقة عرض النصوص"
      >
        <button
          aria-pressed={mode === "templates"}
          onClick={() => setMode("templates")}
        >
          قوالب جاهزة <b>{textPresets.length}</b>
        </button>
        <button aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>
          كتابة وتنسيق
        </button>
      </div>
      {mode === "templates" && (
        <TextPresetCatalog
          disabled={!project.clips.length}
          suspended={suspended}
          onAdd={(p) => {
            onAdd(p.text, p.style);
            setMode("edit");
          }}
        />
      )}
      <div className="text-editor-fields" hidden={mode !== "edit"}>
        {active && (
          <div className="mobile-text-picker">
            <StudioSelect
              label="اختيار النص للتعديل"
              value={active.id}
              onValueChange={onSelect}
              options={project.texts.map((t, i) => ({
                value: t.id,
                label: `${i + 1} · ${t.name || t.text || "نص فارغ"}`,
              }))}
            />
            <button
              aria-label={
                raw?.hidden ? "إظهار النص المحدد" : "إخفاء النص المحدد"
              }
              onClick={() => onChange(active.id, { hidden: !raw?.hidden })}
            >
              {raw?.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              aria-label={
                raw?.locked ? "فتح قفل النص المحدد" : "قفل النص المحدد"
              }
              onClick={() => onChange(active.id, { locked: !raw?.locked })}
            >
              {raw?.locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>
        )}
        <p className="text-panel-intro">
          اختار النص، اكتب كلامك، واسحبه في المعاينة. إعدادات أكتر موجودة تحت لو
          احتجتها.
        </p>
        <div className="text-object-list" aria-label="قائمة النصوص">
          {project.texts.map((t, i) => (
            <div className={t.id === active?.id ? "active" : ""} key={t.id}>
              <button
                className="text-object-name"
                aria-pressed={t.id === active?.id}
                onClick={() => onSelect(t.id)}
              >
                <span>T{i + 1}</span>
                <b>{t.name || t.text || "نص فارغ"}</b>
              </button>
              <button
                aria-label={`${t.hidden ? "إظهار" : "إخفاء"} النص ${i + 1}`}
                onClick={() => onChange(t.id, { hidden: !t.hidden })}
              >
                {t.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                aria-label={`${t.locked ? "فتح قفل" : "قفل"} النص ${i + 1}`}
                onClick={() => onChange(t.id, { locked: !t.locked })}
              >
                {t.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          ))}
        </div>
        {!active ? (
          <div className="text-empty-state">
            <b>كلمتك أول لمسة.</b>
            <p>ضيف نص أو اختار نصًا جاهزًا، وبعدها حرّكه مباشرة في المعاينة.</p>
          </div>
        ) : (
          <div className="text-active-editor" key={active.id}>
            <div className="text-active-heading">
              <b>تعديل النص المحدد</b>
              <button
                aria-label="نسخ النص"
                disabled={active.locked}
                onClick={() => onDuplicate(active.id)}
              >
                ⧉ نسخة
              </button>
            </div>
            {active.locked && (
              <p role="status">
                النص أو مساره مقفول. افتح القفل من القائمة أو أدوات المسار.
              </p>
            )}
            <fieldset className="element-properties" disabled={active.locked}>
              <label className="field-label">
                اسم العنصر
                <input
                  aria-label="اسم العنصر"
                  value={active.name || ""}
                  maxLength={160}
                  onChange={(e) => edit({ name: e.target.value })}
                />
              </label>
              <VectorPathEditor
                key={active.id}
                layer={active}
                onChange={edit}
              />
              {active.box && (
                <>
                  <label className="field-label">
                    لون الشكل
                    <input
                      aria-label="لون الشكل"
                      type="color"
                      value={active.background || "#ffffff"}
                      onChange={(e) => edit({ background: e.target.value })}
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!active.box.gradient}
                      onChange={(e) =>
                        edit({
                          box: {
                            ...active.box!,
                            gradient: e.target.checked ? "#302014" : undefined,
                          },
                        })
                      }
                    />{" "}
                    تدرج لوني
                  </label>
                  {active.box.gradient && (
                    <label>
                      نهاية التدرج
                      <input
                        aria-label="لون نهاية التدرج"
                        type="color"
                        value={active.box.gradient}
                        onChange={(e) =>
                          edit({
                            box: { ...active.box!, gradient: e.target.value },
                          })
                        }
                      />
                    </label>
                  )}
                  <div className="field-row">
                    {(
                      ["width", "height", "radius", "borderWidth"] as const
                    ).map((key, i) => (
                      <label key={key}>
                        {
                          ["العرض", "الارتفاع", "تدوير الزوايا", "سمك الإطار"][
                            i
                          ]
                        }
                        <input
                          aria-label={
                            [
                              "عرض الشكل",
                              "ارتفاع الشكل",
                              "زوايا الشكل",
                              "سمك إطار الشكل",
                            ][i]
                          }
                          type="number"
                          min={i < 2 ? 1 : 0}
                          max={i < 2 ? 4000 : i === 2 ? 2000 : 100}
                          value={active.box![key] || 0}
                          onChange={(e) =>
                            edit({
                              box: {
                                ...active.box!,
                                [key]: Math.max(
                                  i < 2 ? 1 : 0,
                                  Math.min(
                                    i < 2 ? 4000 : i === 2 ? 2000 : 100,
                                    +e.target.value,
                                  ),
                                ),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="field-label">
                    لون الإطار
                    <input
                      aria-label="لون إطار الشكل"
                      type="color"
                      value={active.box.borderColor || active.color}
                      onChange={(e) =>
                        edit({
                          box: { ...active.box!, borderColor: e.target.value },
                        })
                      }
                    />
                  </label>
                </>
              )}
            </fieldset>
            <textarea
              aria-label="محتوى النص"
              disabled={active.locked}
              value={active.text}
              maxLength={5000}
              onFocus={() => onSelect(active.id)}
              onChange={(e) => edit({ text: e.target.value })}
              placeholder="اكتب نصك هنا…"
            />
            <button
              className="secondary full-width"
              disabled={active.locked || active.hidden}
              onClick={() => onInline(active.id)}
            >
              ✎ تعديل داخل المعاينة
            </button>
            <fieldset disabled={active.locked}>
              <legend>الشكل</legend>
              <div className="text-swatches">
                {swatches.map((color) => (
                  <button
                    key={color}
                    aria-label={`لون النص ${color}`}
                    aria-pressed={active.color === color}
                    style={{ background: color }}
                    onClick={() => edit({ color })}
                  />
                ))}
                <label title="لون مخصص">
                  <input
                    aria-label="لون النص المخصص"
                    type="color"
                    value={active.color}
                    onChange={(e) => edit({ color: e.target.value })}
                  />
                </label>
              </div>
              <label className="field-label">
                حجم النص <span>{Math.round(active.size)}</span>
                <input
                  aria-label="حجم النص"
                  type="range"
                  min="12"
                  max="180"
                  value={active.size}
                  onChange={(e) => edit({ size: +e.target.value })}
                />
              </label>
              <div className="text-style-buttons">
                <button
                  aria-pressed={active.bold !== false}
                  onClick={() => edit({ bold: active.bold === false })}
                >
                  <b>B</b> عريض
                </button>
                <button
                  aria-pressed={!!active.outline}
                  onClick={() => edit({ outline: !active.outline })}
                >
                  حدود
                </button>
                <button
                  aria-pressed={!!active.background}
                  onClick={() =>
                    edit({
                      background: active.background ? undefined : "#101116",
                    })
                  }
                >
                  خلفية
                </button>
              </div>
              <StudioSelect
                label="خط النص"
                value={active.font || "sans"}
                onValueChange={(font) =>
                  edit({ font: font as TextLayer["font"] })
                }
                options={[
                  { value: "sans", label: "بسيط — Sans" },
                  { value: "serif", label: "كلاسيكي — Serif" },
                  { value: "mono", label: "آلة كاتبة — Mono" },
                ]}
              />
            </fieldset>
            <CreativeControls layer={active} onChange={edit} />
            <details className="text-advanced">
              <summary>التوقيت والحركة وإعدادات إضافية</summary>
              <fieldset disabled={active.locked}>
                <legend>التوقيت بالثواني</legend>
                <div className="two-fields">
                  <label>
                    يبدأ
                    <input
                      aria-label="بداية النص"
                      type="number"
                      min="0"
                      max={active.end - 0.1}
                      step=".1"
                      value={active.start}
                      onChange={(e) =>
                        edit({
                          start: Math.max(
                            0,
                            Math.min(active.end - 0.1, +e.target.value),
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    ينتهي
                    <input
                      aria-label="نهاية النص"
                      type="number"
                      min={active.start + 0.1}
                      step=".1"
                      max={Math.max(durationOf(project), active.end)}
                      value={active.end}
                      onChange={(e) =>
                        edit({
                          end: Math.max(active.start + 0.1, +e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="field-label">
                  شفافية النص
                  <input
                    aria-label="شفافية النص"
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={active.opacity ?? 1}
                    onChange={(e) => edit({ opacity: +e.target.value })}
                  />
                </label>
                <TextMotionControls layer={active} onChange={edit} />
                <LayerMotionEditor layer={active} onChange={edit} />
              </fieldset>
            </details>
            <button
              className="danger-link"
              disabled={active.locked}
              onClick={() => onRemove(active.id)}
            >
              حذف النص
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
