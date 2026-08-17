import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App.js";
import { ThemeProvider } from "./theme/ThemeProvider.js";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const storedTheme = window.localStorage.getItem("moniapi-theme");
document.documentElement.dataset.theme =
  storedTheme === "light" ? "light" : "dark";

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
