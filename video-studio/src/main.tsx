import { StudioSettings } from "./settings/StudioSettings";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StudioSettings>
    <App />
  </StudioSettings>,
);
