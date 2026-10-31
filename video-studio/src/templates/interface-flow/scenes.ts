export const interfaceScenes = [
  { id: "intro", name: "افتتاحية النوافذ والكود" },
  { id: "design", name: "قبل وبعد — تصميم بشخصية" },
  { id: "components", name: "لوحة المكونات" },
  { id: "magic", name: "تفاعلات وحركات" },
  { id: "figma", name: "من التصميم للكود" },
  { id: "devtools", name: "الفحص والأداء" },
  { id: "outro", name: "ملخص وتعليق" },
] as const;
export type InterfaceScene = (typeof interfaceScenes)[number]["id"];
export const isInterfaceScene = (id: unknown): id is InterfaceScene =>
  interfaceScenes.some((s) => s.id === id);
