import { useState } from "react";
/** المفضلة وآخر الاستخدامات محفوظة كمعرّفات فقط، ولا تمس المشروع أو سجل التراجع. */
export function useLibraryPreferences() {
  const read = (key: string) => {
    try {
      const v = JSON.parse(localStorage.getItem("logo-library-" + key) || "[]");
      return Array.isArray(v)
        ? v.filter((x) => typeof x === "string").slice(0, 60)
        : [];
    } catch {
      return [];
    }
  };
  const [favorites, setFavorites] = useState<string[]>(() => read("favorites")),
    [recent, setRecent] = useState<string[]>(() => read("recent"));
  const store = (key: string, values: string[]) => {
    try {
      localStorage.setItem("logo-library-" + key, JSON.stringify(values));
    } catch {
      /* تظل المكتبة قابلة للاستخدام عند امتلاء التخزين. */
    }
  };
  return {
    favorites,
    recent,
    toggle: (id: string) =>
      setFavorites((old) => {
        const next = old.includes(id)
          ? old.filter((v) => v !== id)
          : [id, ...old].slice(0, 60);
        store("favorites", next);
        return next;
      }),
    used: (id: string) =>
      setRecent((old) => {
        const next = [id, ...old.filter((v) => v !== id)].slice(0, 30);
        store("recent", next);
        return next;
      }),
  };
}
