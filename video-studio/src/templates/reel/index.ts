import type { StudioTemplate } from "../types";
export const reel: StudioTemplate = {
  id: "reel",
  name: "حكاية ريلز",
  description: "٣ مشاهد رأسية بحركة بطيئة وعناوين متحركة",
  ratio: "9:16",
  colors: ["#123c36", "#b7f568"],
  scenes: [
    { text: "كل حكاية… ليها بداية", caption: "اكتب عنوانك هنا", seconds: 4 },
    {
      text: "لحظات تستاهل تتشاف",
      caption: "بدّل الخلفية بصورتك أو فيديوك",
      seconds: 4,
    },
    { text: "شارك حكايتك", caption: "@yourname", seconds: 4 },
  ],
};
