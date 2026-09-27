"use client";
import { useEffect } from "react";

// Registers the Q64 service worker so the game works offline after the first visit.
export default function PWA() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
