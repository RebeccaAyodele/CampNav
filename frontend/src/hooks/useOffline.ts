/**
 * Hook for detecting and responding to offline status.
 * Provides app-wide awareness of network connectivity.
 *
 * Usage:
 *   const isOnline = useOffline();
 *   if (!isOnline) { return <OfflineFallback />; }
 */

import { useNetworkStatus } from "./useNetworkStatus";

export function useOffline(): boolean {
  const { mode } = useNetworkStatus();
  return mode === "offline";
}
