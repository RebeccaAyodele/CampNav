/**
 * useMounted — returns true only after the component has mounted on the client.
 * Use this to guard any browser-only APIs (window, navigator, SpeechRecognition, etc.)
 * so that SSR and the first client render produce identical HTML, preventing
 * React hydration mismatches.
 */

"use client";

import { useState, useEffect } from "react";

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
