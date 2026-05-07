import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Gracefully remove the pre-hydration splash loader
requestAnimationFrame(() => {
  const el = document.getElementById("initial-loader");
  if (!el) return;
  // Small delay so the first paint of the app is ready underneath
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 500);
  }, 250);
});
