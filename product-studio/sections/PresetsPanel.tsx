import { ArrowLeft, Sparkles } from "lucide-react";
import type { Layer } from "../core/model";
export function PresetsPanel({
  add,
  ar,
}: {
  add: (kind: Layer["kind"], patch?: Partial<Layer>) => void;
  ar: boolean;
}) {
  return (
    <>
      {" "}
      <section className="ps-presets">
        <div className="ps-section-head">
          <span>✳</span>
          <h2>{ar ? "بداية ملهمة" : "A little inspiration"}</h2>
        </div>
        <button
          className="ps-preset"
          onClick={() =>
            add("text", {
              name: "OFFLINE CLUB",
              text: "OFFLINE\nCLUB.",
              color: "#344f43",
              font: "Georgia",
              bold: true,
            })
          }
        >
          <span>
            Offline
            <br />
            <i>club.</i>
          </span>
          <small>
            01 — SLOW LIVING <ArrowLeft size={14} />
          </small>
        </button>
        <button
          className="ps-preset ps-preset-orange"
          onClick={() =>
            add("text", {
              name: "صُنع بشغف",
              text: "صُنع\nبشغف",
              color: "#d65b37",
              font: "Tahoma",
            })
          }
        >
          <span>
            صُنع بشغف<span className="ps-preset-star">✳</span>
          </span>
          <small>
            02 — LOCAL SPIRIT <ArrowLeft size={14} />
          </small>
        </button>
        <div className="ps-chip-grid">
          {[
            { text: "CAIRO\nCREATIVE CLUB", font: "Arial", color: "#f0e3be" },
            { text: "LESS IS MORE", font: "monospace", color: "#222222" },
            { text: "أثر جميل", font: "Tahoma", color: "#ef9a64" },
            { text: "EST. 2026", font: "Georgia", color: "#ffffff" },
          ].map((p) => (
            <button
              key={p.text}
              onClick={() =>
                add("text", {
                  ...p,
                  name: p.text,
                  w: 700,
                  h: 300,
                  x: 162,
                  y: 300,
                })
              }
            >
              {p.text}
            </button>
          ))}
        </div>
      </section>
      <div className="ps-local">
        <Sparkles size={17} />
        <p>
          {ar
            ? "تصميمك يخصّك وحدك. كل المعالجة محلية داخل المتصفح، بدون رفع صورك لأي سيرفر."
            : "Your design stays yours. Everything is processed in your browser. No image uploads to a server."}
        </p>
      </div>
    </>
  );
}
