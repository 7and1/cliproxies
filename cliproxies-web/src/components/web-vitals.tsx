"use client";

import { useEffect, useRef } from "react";
import { initWebVitals } from "@/lib/web-vitals";

export function WebVitals() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initialize web vitals monitoring after page load
    if (document.readyState === "complete") {
      initWebVitals();
    } else {
      window.addEventListener("load", initWebVitals, { once: true });
    }

    // Cleanup
    return () => {
      window.removeEventListener("load", initWebVitals);
    };
  }, []);

  return null;
}
