export type StockKind = "image" | "video";
export type StockOrientation = "all" | "landscape" | "portrait" | "square";
export type StockQuality = "hd" | "fullhd";
export type StockFile = { url: string; width: number; height: number };
export type StockItem = {
  id: number;
  kind: StockKind;
  title: string;
  thumbnail: string;
  pageUrl: string;
  author: string;
  authorUrl: string;
  width: number;
  height: number;
  duration: number;
  imageUrl?: string;
  files: StockFile[];
};
export type StockSearch = {
  kind: StockKind;
  query: string;
  orientation: StockOrientation;
};
export type StockPage = {
  items: StockItem[];
  page: number;
  hasMore: boolean;
  translatedQuery: string;
};
export const stockKey = (item: StockItem) => `${item.kind}-${item.id}`;
