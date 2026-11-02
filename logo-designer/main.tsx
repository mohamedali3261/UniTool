import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { fontCSS } from "./fonts";
import "./styles.css";
const style = document.createElement("style");
style.textContent = fontCSS;
document.head.appendChild(style);
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
