import { useEffect, useRef, useState } from "react";
import { address, colName, position, bounds } from "../../core/address";
import { display } from "../../core/calculate";
import {
  themes,
  type Sheet,
  type Selection,
  type Result,
} from "../../core/types";
import { useStudio } from "../../app/context";
export function SheetGrid({
  sheet,
  selection,
  setSelection,
  result,
  onCommit,
  onPaste,
  filter,
}: {
  sheet: Sheet;
  selection: Selection;
  setSelection: (s: Selection) => void;
  result: (ref: string) => Result;
  onCommit: (raw: string, ref?: string) => void;
  onPaste: (text: string) => void;
  filter: string;
}) {
  const { lang, t } = useStudio(),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState(""),
    root = useRef<HTMLDivElement>(null);
  const b = bounds(selection.anchor, selection.end),
    theme = themes[sheet.theme as keyof typeof themes] || themes.emerald;
  useEffect(() => {
    setEditing(null);
  }, [sheet.id]);
  const move = (dr: number, dc: number, extend = false) => {
    const p = position(selection.end),
      ref = address(
        Math.max(0, Math.min(sheet.rows - 1, p.row + dr)),
        Math.max(0, Math.min(sheet.cols - 1, p.col + dc)),
      );
    setSelection({ anchor: extend ? selection.anchor : ref, end: ref });
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLElement>(`[data-ref="${ref}"]`)?.focus(),
    );
  };
  const begin = (ref: string, value = sheet.cells[ref]?.raw || "") => {
    setEditing(ref);
    setDraft(value);
  };
  const finish = () => {
    if (editing) {
      onCommit(draft, editing);
      setEditing(null);
    }
  };
  return (
    <div
      className={"xs-grid-scroll " + (sheet.freeze ? "frozen" : "")}
      ref={root}
      onPaste={(e) => {
        if (editing) return;
        e.preventDefault();
        onPaste(e.clipboardData.getData("text/plain"));
      }}
    >
      <table
        className="xs-grid"
        role="grid"
        aria-label={t("جدول البيانات", "Spreadsheet")}
        aria-rowcount={sheet.rows + 1}
        aria-colcount={sheet.cols + 1}
        dir="ltr"
      >
        <thead>
          <tr>
            <th className="xs-corner">▦</th>
            {Array.from({ length: sheet.cols }, (_, c) => (
              <th key={c} scope="col">
                {colName(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: sheet.rows }, (_, r) => {
            if (
              filter &&
              !(sheet.header && r === 0) &&
              !Array.from({ length: sheet.cols }, (_, c) =>
                String(result(address(r, c)).value ?? ""),
              )
                .join(" ")
                .toLowerCase()
                .includes(filter.toLowerCase())
            )
              return null;
            return (
              <tr key={r}>
                <th scope="row">{r + 1}</th>
                {Array.from({ length: sheet.cols }, (_, c) => {
                  const ref = address(r, c),
                    cell = sheet.cells[ref],
                    res = result(ref),
                    selected = r >= b.r1 && r <= b.r2 && c >= b.c1 && c <= b.c2,
                    active = selection.end === ref,
                    header = sheet.header && r === 0;
                  return (
                    <td
                      key={c}
                      role="gridcell"
                      data-ref={ref}
                      tabIndex={active ? 0 : -1}
                      aria-selected={selected}
                      aria-label={`${ref}: ${display(res.value, cell, sheet, lang)}`}
                      className={
                        (selected ? "selected " : "") +
                        (active ? "active " : "") +
                        (res.error ? "cell-error " : "") +
                        (header ? "data-header" : "")
                      }
                      title={res.error || cell?.raw || ref}
                      style={{
                        backgroundColor:
                          cell?.fill ||
                          (header
                            ? theme.head
                            : sheet.striped && r % 2 === 0
                              ? theme.stripe
                              : "#fff"),
                        color: res.error
                          ? "#c03440"
                          : cell?.color ||
                            (header
                              ? "#fff"
                              : sheet.negative &&
                                  typeof res.value === "number" &&
                                  res.value < 0
                                ? "#c03440"
                                : "#273a35"),
                        fontWeight: cell?.bold || header ? 700 : 400,
                        fontStyle: cell?.italic ? "italic" : undefined,
                        textAlign:
                          cell?.align ||
                          (typeof res.value === "number" ? "right" : "start"),
                      }}
                      onClick={(e) => {
                        if (editing === ref) return;
                        setSelection({
                          anchor: e.shiftKey ? selection.anchor : ref,
                          end: ref,
                        });
                      }}
                      onDoubleClick={() => begin(ref)}
                      onKeyDown={(e) => {
                        if (editing) return;
                        if (e.ctrlKey || e.metaKey) return;
                        if (
                          [
                            "ArrowDown",
                            "ArrowUp",
                            "ArrowLeft",
                            "ArrowRight",
                            "Tab",
                            "Enter",
                          ].includes(e.key)
                        ) {
                          e.preventDefault();
                          move(
                            e.key === "ArrowDown" || e.key === "Enter"
                              ? 1
                              : e.key === "ArrowUp"
                                ? -1
                                : 0,
                            e.key === "ArrowRight"
                              ? 1
                              : e.key === "ArrowLeft"
                                ? -1
                                : e.key === "Tab"
                                  ? e.shiftKey
                                    ? -1
                                    : 1
                                  : 0,
                            e.shiftKey && e.key !== "Tab",
                          );
                        } else if (
                          e.key === "Delete" ||
                          e.key === "Backspace"
                        ) {
                          e.preventDefault();
                          onCommit("", ref);
                        } else if (e.key === "F2") {
                          e.preventDefault();
                          begin(ref);
                        } else if (e.key.length === 1 && !e.altKey) {
                          e.preventDefault();
                          begin(ref, e.key);
                        }
                      }}
                    >
                      {editing === ref ? (
                        <input
                          autoFocus
                          value={draft}
                          aria-label={t("تعديل", "Edit") + " " + ref}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={finish}
                          dir="auto"
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" || e.key === "Tab") {
                              e.preventDefault();
                              finish();
                              move(
                                e.key === "Enter" ? 1 : 0,
                                e.key === "Tab" ? (e.shiftKey ? -1 : 1) : 0,
                              );
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setEditing(null);
                            }
                          }}
                        />
                      ) : (
                        <span dir="auto">
                          {display(res.value, cell, sheet, lang) || "\u00a0"}
                          {cell?.raw.startsWith("=") && (
                            <i className="xs-formula-indicator" />
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
