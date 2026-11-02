import type { StudioTemplate } from "../types";
export const interfaceFlow: StudioTemplate = {
  id: "interface-flow",
  name: "Interface Flow — خمس أدوات",
  ratio: "9:16",
  colors: ["#071c19", "#4bdfc5"],
  description:
    "ريل ٧٠ ثانية • ٧ مشاهد واجهات متحركة • كود ومؤشر وكيبورد • مستوحى من الوصف، وليس نسخة من الملف الأصلي",
  scenes: [
    { text: "Claude Code", caption: "٥ أدوات لتصميم\nمواقع أجمل", seconds: 8 },
    {
      text: "frontend-design",
      caption: "تصميم بشخصية، مش قالب مكرر",
      seconds: 10,
    },
    {
      text: "shadcn/ui MCP",
      caption: "مكونات نضيفة. تجربة أوضح.",
      seconds: 10,
    },
    { text: "21st.dev Magic", caption: "حركة صغيرة… فرق كبير", seconds: 10 },
    { text: "Figma MCP", caption: "من التصميم… للكود", seconds: 10 },
    { text: "DevTools MCP", caption: "افحص. حسّن. جرّب تاني.", seconds: 10 },
    {
      text: "خلي تصميمك أحلى",
      caption: "اكتب «كلود» في التعليقات",
      seconds: 12,
    },
  ],
};
