import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/App";
// Global styles (Tailwind preflight + theme) are off on purpose while we prototype the
// game logic with browser-default HTML. Re-enable with: import "@/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
