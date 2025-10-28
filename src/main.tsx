import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { applyTheme, resolveInitialTheme } from "./features/theme/themeManager";
import App from "./App";

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

const container = document.getElementById("root");

if (!container) {
  throw new Error("No se encontro el elemento root");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
