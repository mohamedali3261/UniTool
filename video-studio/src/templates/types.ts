export type StudioTemplate = {
  id: string;
  name: string;
  description: string;
  ratio: string;
  colors: [string, string];
  scenes: { text: string; caption: string; seconds: number }[];
};
