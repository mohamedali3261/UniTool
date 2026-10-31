export function readFavorites(): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem("unitool-elements-favorites") || "[]",
    );
    return Array.isArray(value)
      ? value.filter((v) => typeof v === "string").slice(0, 1000)
      : [];
  } catch {
    return [];
  }
}
export function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem("unitool-elements-favorites", JSON.stringify(ids));
  } catch {
    /* Private mode may deny storage. */
  }
}
