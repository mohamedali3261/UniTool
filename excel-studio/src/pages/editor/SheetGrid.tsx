import { wholeSelection } from "../../core/selectionTools";
import { conditionalStyle } from "../../core/tableFeatures";
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
  onResize,
  onClearSelection,
}: {
  sheet: Sheet;
  selection: Selection;
  setSelection: (s: Selection) => void;
  result: (ref: string) => Result;
  onCommit: (raw: string, ref?: string) => void;
  onPaste: (text: string) => void;
  filter: string;
  onResize: (col: number, width: number) => void;
  onClearSelection: () => void;
}) {
  const { lang, t } = useStudio(),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState(""),
    root = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    col: number;
    start: number;
    width: number;
    current: number;
  } | null>(null);
  const drag = useRef<{
    anchor: string;
    end: string;
    x: number;
    y: number;
  } | null>(null);
  const frame = useRef<number>(0);
  const stopDrag = () => {
    drag.current = null;
    cancelAnimationFrame(frame.current);
  };
  useEffect(
    () => () => {
      drag.current = null;
      cancelAnimationFrame(frame.current);
    },
    [],
  );
  useEffect(() => {
    stopDrag();
  }, [sheet.id]);
  const tickDrag = () => {
    const d = drag.current,
      el = root.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    if (d.x < rect.left + 30) el.scrollLeft -= 16;
    else if (d.x > rect.right - 30) el.scrollLeft += 16;
    if (d.y < rect.top + 36) el.scrollTop -= 14;
    else if (d.y > rect.bottom - 30) el.scrollTop += 14;
    const target = document
      .elementFromPoint(
        Math.max(rect.left + 40, Math.min(rect.right - 3, d.x)),
        Math.max(rect.top + 34, Math.min(rect.bottom - 3, d.y)),
      )
      ?.closest<HTMLElement>("[data-ref]");
    const ref = target?.dataset.ref;
    if (ref && el.contains(target) && ref !== d.end) {
      d.end = ref;
      setSelection({ anchor: d.anchor, end: ref });
    }
    frame.current = requestAnimationFrame(tickDrag);
  };
  const counts = new Map<string, number>();
  if (sheet.conditional?.some((r) => r.op === "duplicates"))
    for (let r = sheet.header ? 1 : 0; r < sheet.rows; r++)
      for (const c of new Set(
        sheet.conditional
          .filter((v) => v.op === "duplicates")
          .map((v) => v.column),
      )) {
        const value = result(address(r, c)).value,
          key = c + ":" + typeof value + ":" + String(value ?? "");
        counts.set(key, (counts.get(key) || 0) + 1);
      }
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
      onPointerMove={(e) => {
        if (drag.current) {
          drag.current.x = e.clientX;
          drag.current.y = e.clientY;
          cancelAnimationFrame(frame.current);
          tickDrag();
        }
      }}
      onPointerUp={(e) => {
        if (drag.current) {
          drag.current.x = e.clientX;
          drag.current.y = e.clientY;
          cancelAnimationFrame(frame.current);
          tickDrag();
          const end = drag.current?.end;
          stopDrag();
          if (end)
            root.current
              ?.querySelector<HTMLElement>(`[data-ref="${end}"]`)
              ?.focus({ preventScroll: true });
        }
      }}
      onPointerCancel={stopDrag}
      onLostPointerCapture={stopDrag}
      onKeyDown={(e) => {
        if (editing || (e.target as HTMLElement).closest("td")) return;
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onClearSelection();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          setSelection(wholeSelection(sheet));
        }
      }}
      onCopy={(e) => {
        if (editing) return;
        e.preventDefault();
        const rows = [];
        for (let r = b.r1; r <= b.r2; r++) {
          const values = [];
          for (let c = b.c1; c <= b.c2; c++)
            values.push(sheet.cells[address(r, c)]?.raw || "");
          rows.push(values.join("\t"));
        }
        e.clipboardData.setData("text/plain", rows.join("\n"));
      }}
      onPaste={(e) => {
        if (editing) return;
        e.preventDefault();
        onPaste(e.clipboardData.getData("text/plain"));
      }}
    >
      <table
        className={"xs-grid " + (sheet.wrap ? "xs-wrap" : "")}
        role="grid"
        aria-multiselectable="true"
        aria-label={t("جدول البيانات", "Spreadsheet")}
        aria-rowcount={sheet.rows + 1}
        aria-colcount={sheet.cols + 1}
        dir="ltr"
      >
        <colgroup>
          <col style={{ width: 34 }} />
          {Array.from({ length: sheet.cols }, (_, c) => (
            <col
              key={c}
              style={{
                width:
                  resizing?.col === c
                    ? resizing.current
                    : sheet.columnWidths?.[c] || 125,
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="xs-corner">
              <button
                type="button"
                aria-label={t("تحديد كل الخلايا", "Select all cells")}
                onClick={() => setSelection(wholeSelection(sheet))}
              >
                ▦
              </button>
            </th>
            {Array.from({ length: sheet.cols }, (_, c) => (
              <th
                key={c}
                scope="col"
                style={{
                  width:
                    resizing?.col === c
                      ? resizing.current
                      : sheet.columnWidths?.[c] || 125,
                }}
              >
                <button
                  type="button"
                  className={c >= b.c1 && c <= b.c2 ? "xs-header-selected" : ""}
                  aria-label={t("تحديد العمود ", "Select column ") + colName(c)}
                  onClick={(e) =>
                    setSelection({
                      anchor: e.shiftKey
                        ? address(0, position(selection.anchor).col)
                        : address(0, c),
                      end: address(sheet.rows - 1, c),
                    })
                  }
                >
                  {colName(c)}
                </button>
                <span
                  className="xs-column-resize"
                  role="separator"
                  aria-label={t("عرض العمود ", "Column width ") + colName(c)}
                  aria-orientation="vertical"
                  tabIndex={0}
                  aria-valuenow={sheet.columnWidths?.[c] || 125}
                  aria-valuemin={70}
                  aria-valuemax={400}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                      e.preventDefault();
                      onResize(
                        c,
                        Math.max(
                          70,
                          Math.min(
                            400,
                            (sheet.columnWidths?.[c] || 125) +
                              (e.key === "ArrowRight" ? 10 : -10),
                          ),
                        ),
                      );
                    }
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setResizing({
                      col: c,
                      start: e.clientX,
                      width: sheet.columnWidths?.[c] || 125,
                      current: sheet.columnWidths?.[c] || 125,
                    });
                  }}
                  onPointerMove={(e) => {
                    if (resizing?.col === c)
                      setResizing({
                        ...resizing,
                        current: Math.max(
                          70,
                          Math.min(
                            400,
                            resizing.width + e.clientX - resizing.start,
                          ),
                        ),
                      });
                  }}
                  onPointerUp={() => {
                    if (resizing) {
                      onResize(c, resizing.current);
                      setResizing(null);
                    }
                  }}
                  onPointerCancel={() => setResizing(null)}
                />
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
                <th scope="row">
                  <button
                    type="button"
                    className={
                      r >= b.r1 && r <= b.r2 ? "xs-header-selected" : ""
                    }
                    aria-label={t("تحديد الصف ", "Select row ") + (r + 1)}
                    onClick={(e) =>
                      setSelection({
                        anchor: e.shiftKey
                          ? address(position(selection.anchor).row, 0)
                          : address(r, 0),
                        end: address(r, sheet.cols - 1),
                      })
                    }
                  >
                    {r + 1}
                  </button>
                </th>
                {Array.from({ length: sheet.cols }, (_, c) => {
                  const ref = address(r, c),
                    cell = sheet.cells[ref],
                    res = result(ref),
                    selected = r >= b.r1 && r <= b.r2 && c >= b.c1 && c <= b.c2,
                    active = selection.end === ref,
                    header = sheet.header && r === 0,
                    conditional = header
                      ? null
                      : conditionalStyle(
                          res.value,
                          c,
                          sheet.conditional || [],
                          counts,
                        );
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
                        (selected && r === b.r1 ? "xs-range-top " : "") +
                        (selected && r === b.r2 ? "xs-range-bottom " : "") +
                        (selected && c === b.c1 ? "xs-range-left " : "") +
                        (selected && c === b.c2 ? "xs-range-right " : "") +
                        (active ? "active " : "") +
                        (res.error ? "cell-error " : "") +
                        (header ? "data-header" : "")
                      }
                      title={res.error || cell?.raw || ref}
                      style={{
                        backgroundColor:
                          conditional?.fill ||
                          cell?.fill ||
                          (header
                            ? theme.head
                            : sheet.striped && r % 2 === 0
                              ? theme.stripe
                              : "#fff"),
                        color: res.error
                          ? "#c03440"
                          : conditional?.color ||
                            cell?.color ||
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
                      onPointerDown={(e) => {
                        if (editing === ref || e.button !== 0) return;
                        if (editing) finish();
                        const anchor = e.shiftKey ? selection.anchor : ref;
                        setSelection({ anchor, end: ref });
                        if (e.pointerType !== "touch") {
                          e.preventDefault();
                          e.currentTarget.focus({ preventScroll: true });
                          e.currentTarget.setPointerCapture(e.pointerId);
                          stopDrag();
                          drag.current = {
                            anchor,
                            end: ref,
                            x: e.clientX,
                            y: e.clientY,
                          };
                          frame.current = requestAnimationFrame(tickDrag);
                        }
                      }}
                      onDoubleClick={() => begin(ref)}
                      onKeyDown={(e) => {
                        if (editing) return;
                        if (
                          e.key === " " &&
                          (e.shiftKey || e.ctrlKey || e.metaKey)
                        ) {
                          e.preventDefault();
                          const p = position(selection.end);
                          setSelection(
                            e.shiftKey && (e.ctrlKey || e.metaKey)
                              ? wholeSelection(sheet)
                              : e.shiftKey
                                ? {
                                    anchor: address(p.row, 0),
                                    end: address(p.row, sheet.cols - 1),
                                  }
                                : {
                                    anchor: address(0, p.col),
                                    end: address(sheet.rows - 1, p.col),
                                  },
                          );
                          return;
                        }
                        if (e.ctrlKey || e.metaKey) {
                          if (e.key.toLowerCase() === "a") {
                            e.preventDefault();
                            setSelection(wholeSelection(sheet));
                          } else if (e.key === "Home" || e.key === "End") {
                            e.preventDefault();
                            const populated = Object.entries(sheet.cells)
                              .filter(([, cell]) => cell.raw !== "")
                              .map(([ref]) => position(ref));
                            const end =
                              e.key === "Home"
                                ? "A1"
                                : address(
                                    Math.min(
                                      sheet.rows - 1,
                                      Math.max(
                                        0,
                                        ...populated.map((p) => p.row),
                                      ),
                                    ),
                                    Math.min(
                                      sheet.cols - 1,
                                      Math.max(
                                        0,
                                        ...populated.map((p) => p.col),
                                      ),
                                    ),
                                  );
                            setSelection({
                              anchor: e.shiftKey ? selection.anchor : end,
                              end,
                            });
                            requestAnimationFrame(() =>
                              root.current
                                ?.querySelector<HTMLElement>(
                                  `[data-ref="${end}"]`,
                                )
                                ?.focus(),
                            );
                          }
                          return;
                        }
                        if (e.key === "Home") {
                          e.preventDefault();
                          const end = address(position(selection.end).row, 0);
                          setSelection({
                            anchor: e.shiftKey ? selection.anchor : end,
                            end,
                          });
                          requestAnimationFrame(() =>
                            root.current
                              ?.querySelector<HTMLElement>(
                                `[data-ref="${end}"]`,
                              )
                              ?.focus(),
                          );
                          return;
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setSelection({
                            anchor: selection.end,
                            end: selection.end,
                          });
                          return;
                        }
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
                              ? e.key === "Enter" && e.shiftKey
                                ? -1
                                : 1
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
                            e.shiftKey && !["Tab", "Enter"].includes(e.key),
                          );
                        } else if (
                          e.key === "Delete" ||
                          e.key === "Backspace"
                        ) {
                          e.preventDefault();
                          onClearSelection();
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
                          {(sheet.showFormulas && cell?.raw.startsWith("=")
                            ? cell.raw
                            : display(res.value, cell, sheet, lang)) ||
                            "\u00a0"}
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
