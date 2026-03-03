import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Dev-only: suppress known noisy console errors from Google Sign-In / extensions (not fixable in our code)
if (import.meta.env.DEV) {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const combined = args.map((a) => (a instanceof Error ? a.message : String(a ?? ""))).join(" ");
    if (
      (combined.includes("GSI_LOGGER") && combined.includes("origin is not allowed")) ||
      combined.includes("message port closed")
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
