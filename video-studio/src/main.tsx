import { StudioSettings } from "./settings/StudioSettings";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./animation/motions/styles.css";
import "./media/import.css";
import "./text/catalog.css";
import "./pages/Editor/mobile/mobile.css";
import "./pages/Editor/mobile/compact.css";
import "./pages/Editor/mobile/tool-pages.css";
createRoot(document.getElementById("root")!).render(
  <StudioSettings>
    <App />
  </StudioSettings>,
);
