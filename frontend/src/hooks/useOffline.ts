/**
 * Hook for detecting and responding to offline status.
 * Provides app-wide awareness of network connectivity.
 *
 * Usage:
 *   const isOnline = useOffline();
 *   if (!isOnline) { return <OfflineFallback />; }
 */

import { useState, useEffect } from "react";

export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}
