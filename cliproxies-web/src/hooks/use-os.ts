"use client";

import { useEffect, useState } from "react";

export type OS = "mac" | "windows" | "linux" | "other";

// Cache the OS detection result for the current user agent string.
let cachedOS: OS | null = null;
let cachedUserAgent: string | null = null;

function detectOS(): OS {
  if (typeof window === "undefined") return "other";

  const ua = window.navigator.userAgent || "";
  if (cachedOS && cachedUserAgent === ua) return cachedOS;

  const normalizedUA = ua.toLowerCase();
  if (normalizedUA.includes("mac")) {
    cachedOS = "mac";
  } else if (normalizedUA.includes("win")) {
    cachedOS = "windows";
  } else if (normalizedUA.includes("linux")) {
    cachedOS = "linux";
  } else {
    cachedOS = "other";
  }

  cachedUserAgent = ua;
  return cachedOS;
}

export function useOS(): OS {
  const [os, setOS] = useState<OS>(detectOS());

  useEffect(() => {
    setOS(detectOS());
  }, []);

  return os;
}
