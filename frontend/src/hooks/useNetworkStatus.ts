/**
 * Network status hook — stable, no flicker.
 *
 * Strategy:
 *  - Uses browser "online"/"offline" events as the primary signal.
 *  - Does NOT poll a backend health endpoint (that caused constant offline/online flipping
 *    whenever the API server is unavailable in dev or at the venue).
 *  - Debounces status changes by 800 ms so momentary connectivity blips don't cause
 *    the badge to flash.
 *  - Starts with `null` (unknown) and resolves after mount to avoid hydration mismatch.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { syncOfflineQueue } from "@/lib/syncManager";

export type ConnectionMode = "online" | "offline";

interface NetworkStatus {
  isOnline: boolean;
  isServerReachable: boolean;
  mode: ConnectionMode;
  queueCount: number;
}

export function useNetworkStatus(): NetworkStatus {
  // Start "true" so first render (SSR and client-before-mount) match.
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyStatus = useCallback((online: boolean) => {
    // Debounce to avoid rapid flip-flop on brief connectivity changes
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsOnline(online);
      if (online) {
        // Auto-sync queued items when connectivity returns
        syncOfflineQueue().then(() => {
          import("@/lib/offlineQueue").then(({ getCount }) => {
            getCount().then(setQueueCount);
          });
        });
      }
    }, 800);
  }, []);

  useEffect(() => {
    // Sync with actual browser state after mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => applyStatus(true);
    const handleOffline = () => applyStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load queue count once on mount
    import("@/lib/offlineQueue").then(({ getCount }) => {
      getCount().then(setQueueCount);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [applyStatus]);

  return {
    isOnline,
    isServerReachable: isOnline, // Simplified — no flaky backend polling
    mode: isOnline ? "online" : "offline",
    queueCount,
  };
}
