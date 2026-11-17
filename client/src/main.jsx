import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.pustInstallPrompt = event;
  window.dispatchEvent(new Event("pust:install-available"));
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Browsing still works when installation is unavailable. */
    }),
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
