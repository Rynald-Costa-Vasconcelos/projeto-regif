import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AppProviders } from "./app/providers";

createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
