import { LIMITS, type EditState, type Annotation } from "./types";
export function parseProject(
  input: unknown,
  hash: string,
  pageCount: number,
): EditState {
  const p = input as any;
  if (
    p?.version !== 1 ||
    p.fingerprint !== hash ||
    !Array.isArray(p.pages) ||
    !p.pages.length ||
    p.pages.length > LIMITS.pages
  )
    throw Error(
      "المشروع لا يطابق ملف PDF أو تالف / Project does not match this PDF",
    );
  let total = 0;
  const ids = new Set<string>();
  const pages = p.pages.map((page: any) => {
    if (
      !page ||
      typeof page.id !== "string" ||
      ids.has(page.id) ||
      !Number.isInteger(page.source) ||
      page.source < 0 ||
      page.source >= pageCount ||
      ![0, 90, 180, 270].includes(page.rotation) ||
      !Array.isArray(page.annotations) ||
      page.annotations.length > LIMITS.perPage
    )
      throw Error("Invalid project page");
    ids.add(page.id);
    const annotations: Annotation[] = page.annotations.map((a: any) => {
      if (
        !a ||
        typeof a.id !== "string" ||
        !["text", "highlight", "pen", "rectangle", "cover"].includes(a.type) ||
        !["x", "y", "w", "h", "fontSize"].every((k) => Number.isFinite(a[k])) ||
        a.x < 0 ||
        a.y < 0 ||
        a.x > 5000 ||
        a.y > 5000 ||
        a.w < 0 ||
        a.h < 0 ||
        a.w > 5000 ||
        a.h > 5000 ||
        a.fontSize < 8 ||
        a.fontSize > 96 ||
        !/^#[\da-f]{6}$/i.test(a.color) ||
        typeof (a.text ?? "") !== "string" ||
        (a.text?.length || 0) > 1000
      )
        throw Error("Invalid annotation");
      if (
        a.points &&
        (!Array.isArray(a.points) ||
          a.points.length > 1500 ||
          a.points.some(
            (p: any) =>
              !p ||
              !Number.isFinite(p.x) ||
              !Number.isFinite(p.y) ||
              p.x < 0 ||
              p.y < 0 ||
              p.x > 5000 ||
              p.y > 5000,
          ))
      )
        throw Error("Invalid path");
      total++;
      return {
        id: a.id,
        type: a.type,
        x: a.x,
        y: a.y,
        w: a.w,
        h: a.h,
        fontSize: a.fontSize,
        color: a.color,
        text: a.text,
        points: a.points,
      };
    });
    return {
      id: page.id,
      source: page.source,
      rotation: page.rotation,
      annotations,
    };
  });
  if (total > LIMITS.annotations) throw Error("Too many annotations");
  return { pages };
}
