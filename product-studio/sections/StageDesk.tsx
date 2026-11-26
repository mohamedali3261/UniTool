import type { RefObject } from "react";
import {
  Box,
  Columns2,
  UserRound,
  Layers,
  RotateCw,
  RotateCcw,
  MoveUpRight,
  HelpCircle,
} from "lucide-react";
import { products, type Project, type Side, type Layer } from "../core/model";
import { TryOnDesk } from "./TryOnDesk";
import { PatternDesk } from "./PatternDesk";
import { partNames } from "../core/model";
import { Editor2D } from "./Editor2D";
import { Preview3D, type PreviewHandle } from "./Preview3D";
export function StageDesk({
  mode,
  setMode,
  project,
  side,
  setSide,
  spin,
  setSpin,
  help,
  setHelp,
  selected,
  select,
  change,
  changePart,
  patch,
  preview,
  notify,
  ar,
}: {
  mode: "2d" | "3d" | "person" | "split";
  setMode: (m: "2d" | "3d" | "person" | "split") => void;
  project: Project;
  side: Side;
  setSide: (s: Side) => void;
  spin: boolean;
  setSpin: (b: boolean) => void;
  help: boolean;
  setHelp: (b: boolean) => void;
  selected: string | null;
  select: (s: string | null) => void;
  change: (id: string, p: Partial<Layer>) => void;
  changePart: (part: Side, id: string, p: Partial<Layer>) => void;
  patch: (p: Partial<Project>) => void;
  preview: RefObject<PreviewHandle | null>;
  notify: (s: string) => void;
  ar: boolean;
}) {
  if (mode === "person")
    return (
      <main className="ps-main ps-person-main">
        <div className="ps-stage-toolbar">
          <div className="ps-segment">
            <button onClick={() => setMode("split")}>
              <Columns2 size={16} />
              {ar ? "عرض مقسوم" : "Split view"}
            </button>
            <button onClick={() => setMode("3d")}>
              <Box size={16} />
              3D <span>{ar ? "معاينة" : "Preview"}</span>
            </button>
            <button onClick={() => setMode("2d")}>
              <Layers size={16} />
              2D <span>{ar ? "تصميم" : "Design"}</span>
            </button>
            <button className="active">
              <UserRound size={16} />
              {ar ? "على شخص 2D" : "On person 2D"}
            </button>
          </div>
        </div>
        <TryOnDesk project={project} patch={patch} ar={ar} notify={notify} />
      </main>
    );
  const has3D = mode === "3d" || mode === "split";
  return (
    <main
      className={`ps-main ps-layout-${mode} ${mode === "2d" ? "is-editing" : ""}`}
    >
      <div className="ps-live-workspace">
        <div className="ps-stage-toolbar">
          <div className="ps-segment">
            <button
              className={mode === "split" ? "active" : ""}
              aria-pressed={mode === "split"}
              onClick={() => setMode("split")}
            >
              <Columns2 size={16} />
              {ar ? "عرض مقسوم" : "Split view"}
            </button>
            {(["3d", "2d"] as const).map((m) => (
              <button
                key={m}
                className={mode === m ? "active" : ""}
                onClick={() => setMode(m)}
              >
                {m === "3d" ? <Box size={16} /> : <Layers size={16} />}{" "}
                {m.toUpperCase()}
                <span>
                  {m === "3d"
                    ? ar
                      ? "معاينة"
                      : "Preview"
                    : ar
                      ? "تصميم"
                      : "Design"}
                </span>
              </button>
            ))}
            <button onClick={() => setMode("person")}>
              <UserRound size={16} />
              {ar ? "على شخص 2D" : "On person 2D"}
            </button>
          </div>
          <button
            className="ps-help"
            title={ar ? "دليل سريع" : "Quick guide"}
            onClick={() => setHelp(!help)}
          >
            <HelpCircle size={17} />
          </button>
        </div>
        <div className="ps-stage" style={{ background: project.background }}>
          <div className="ps-stage-heading">
            <span className="ps-eyebrow">
              GARMENT WORKSPACE / {partNames[side][ar ? "ar" : "en"]}
            </span>
            <h2>
              {ar
                ? "قطعة عادية. بصمة استثنائية."
                : "Everyday piece. Uncommon character."}
            </h2>
          </div>
          {has3D ? (
            <Preview3D
              ref={preview}
              project={project}
              side={side}
              spin={spin}
              ar={ar}
              onError={notify}
            />
          ) : (
            <Editor2D
              project={project}
              side={side}
              selected={selected}
              select={select}
              change={change}
              ar={ar}
            />
          )}
          <div className="ps-stage-badge">
            <span className="ps-dot" />
            {has3D ? "LIVE 3D PREVIEW" : "2D ARTWORK EDITOR"}
          </div>
          <div className="ps-stage-number">
            {products.find((p) => p.id === project.product)?.label}
            <span> / 04</span>
          </div>
        </div>
        <div className="ps-stage-bottom">
          <div className="ps-segment ps-sides">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                className={side === s ? "active" : ""}
                onClick={() => {
                  setSide(s);
                  select(null);
                }}
              >
                {ar
                  ? s === "front"
                    ? "الوجه الأمامي"
                    : "الوجه الخلفي"
                  : s === "front"
                    ? "Front side"
                    : "Back side"}
              </button>
            ))}
          </div>
          <div className="ps-view-tools">
            {has3D && (
              <select
                className="ps-camera-select"
                aria-label={ar ? "زاوية التصوير" : "Camera angle"}
                defaultValue=""
                onChange={(e) => {
                  preview.current?.setCameraView(
                    e.target.value as "front" | "quarter" | "side" | "back",
                  );
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  {ar ? "زوايا التصوير" : "Camera presets"}
                </option>
                <option value="front">{ar ? "أمامي" : "Front"}</option>
                <option value="quarter">
                  {ar ? "ثلاثة أرباع" : "Three-quarter"}
                </option>
                <option value="side">{ar ? "جانبي" : "Side"}</option>
                <option value="back">{ar ? "خلفي" : "Back"}</option>
              </select>
            )}
            {has3D && (
              <button
                title={ar ? "إعادة ضبط الكاميرا" : "Reset camera"}
                onClick={() => preview.current?.resetView()}
              >
                <RotateCcw size={15} />
              </button>
            )}
            {has3D && (
              <button
                className={spin ? "active" : ""}
                aria-pressed={spin}
                onClick={() => setSpin(!spin)}
              >
                <RotateCw size={16} />
                {ar ? "دوران تلقائي" : "Auto rotate"}
              </button>
            )}
            <label title={ar ? "خلفية المشهد" : "Scene background"}>
              <input
                type="color"
                aria-label={ar ? "خلفية المشهد" : "Scene background"}
                value={project.background}
                onChange={(e) => patch({ background: e.target.value })}
              />
            </label>
          </div>
        </div>
        <div className="ps-tip">
          <MoveUpRight size={15} />
          {has3D
            ? ar
              ? "اسحب لتدوير القطعة · مرّر للتقريب · صمّم من تبويب 2D"
              : "Drag to orbit · Scroll to zoom · Design in the 2D tab"
            : ar
              ? "التصميم هنا يُطبّق مباشرة على مساحة الطباعة في المجسم"
              : "Your artwork is applied live to the product print area"}
        </div>
      </div>
      {mode !== "3d" && (
        <PatternDesk
          patch={patch}
          project={project}
          side={side}
          setSide={setSide}
          selected={selected}
          select={select}
          change={changePart}
          edit={() => setMode("2d")}
          ar={ar}
        />
      )}
      {help && (
        <div className="ps-guide">
          <b>
            {ar
              ? "من الفكرة إلى الصورة في ٣ خطوات"
              : "From idea to image in 3 steps"}
          </b>
          <p>
            {ar
              ? "١. اختر القطعة ولونها. ٢. أضف النصوص والصور وعدّلها في 2D، وحدد الوجه أو الظهر. ٣. افتح 3D لاختيار زاوية التصوير ثم صدّر PNG. احفظ ملف المشروع لنقله لجهاز آخر."
              : "1. Pick a product and color. 2. Add and edit text and images in 2D, on either side. 3. Choose a camera angle in 3D, then export PNG. Save a project file to move between devices."}
          </p>
        </div>
      )}
    </main>
  );
}
