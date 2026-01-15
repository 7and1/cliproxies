"use client";

import { useEffect, useState } from "react";

export type OS = "mac" | "windows" | "linux" | "other";

// Cache the OS detection result since it won't change during a session
let cachedOS: OS | null = null;

function detectOS(): OS {
  if (cachedOS) return cachedOS;

  if (typeof window === "undefined") return "other";

  const ua = window.navigator.userAgent;
  if (ua.includes("Mac")) {
    cachedOS = "mac";
  } else if (ua.includes("Win")) {
    cachedOS = "windows";
  } else if (ua.includes("Linux")) {
    cachedOS = "linux";
  } else {
    cachedOS = "other";
  }

  return cachedOS;
}

export function useOS(): OS {
  const [os, setOS] = useState<OS>(detectOS());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOS(detectOS());
  }, []);

  // Return cached value during SSR, actual value after hydration
  return mounted ? os : "other";
}
