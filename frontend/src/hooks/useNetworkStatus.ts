/**
 * Enhanced network status hook.
 * Combines browser online/offline detection with backend health check.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { config } from "@/config";
import { initSyncListeners, syncOfflineQueue } from "@/lib/syncManager";

export type ConnectionMode = "online" | "offline";

interface NetworkStatus {
  isOnline: boolean;
  isServerReachable: boolean;
  mode: ConnectionMode;
  queueCount: number;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.api.baseUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        setIsServerReachable(true);
      } else {
        setIsServerReachable(false);
      }
    } catch {
      setIsServerReachable(false);
    }
  }, []);

  useEffect(() => {
    // Browser online/offline
    const handleOnline = () => {
      setIsOnline(true);
      checkHealth();
      // Auto-sync when coming back online
      syncOfflineQueue().then(() => {
        import("@/lib/offlineQueue").then(({ getCount }) => {
          getCount().then(setQueueCount);
        });
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial health check
    if (navigator.onLine) {
      checkHealth();
    }

    // Periodic health check
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkHealth();
      }
    }, config.timeouts.healthCheckInterval);

    // Init sync listeners
    cleanupRef.current = initSyncListeners();

    // Check queue count
    import("@/lib/offlineQueue").then(({ getCount }) => {
      getCount().then(setQueueCount);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      cleanupRef.current?.();
    };
  }, [checkHealth]);

  const mode: ConnectionMode =
    isOnline && isServerReachable ? "online" : "offline";

  return { isOnline, isServerReachable, mode, queueCount };
}
