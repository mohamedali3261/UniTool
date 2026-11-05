import { createRoot } from "react-dom/client";
import HomePage from "./index";
import "./home.css";
import "../../styles/studio-controls.css";
import "../../styles/site-appearance.css";
createRoot(document.getElementById("root")!).render(<HomePage />);
