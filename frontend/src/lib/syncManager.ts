/**
 * Network recovery sync manager.
 * Listens for online events and drains the offline queue.
 */

import { getAll, remove, type QueuedItem } from "./offlineQueue";
import { apiClient } from "./api";
import { logger } from "./logger";

let isSyncing = false;
let listenerAttached = false;

/** Attempt to send all queued items to the backend */
export async function syncOfflineQueue(): Promise<{ sent: number; failed: number }> {
  if (isSyncing) return { sent: 0, failed: 0 };
  isSyncing = true;

  let sent = 0;
  let failed = 0;

  try {
    const items = await getAll();
    if (items.length === 0) {
      return { sent: 0, failed: 0 };
    }

    logger.info("Syncing offline queue", { count: items.length });

    for (const item of items) {
      try {
        await sendItem(item);
        if (item.id !== undefined) {
          await remove(item.id);
        }
        sent++;
      } catch (error) {
        logger.error("Failed to sync queued item", { type: item.type, id: item.id });
        failed++;
      }
    }

    logger.info("Offline queue sync complete", { sent, failed });
  } finally {
    isSyncing = false;
  }

  return { sent, failed };
}

async function sendItem(item: QueuedItem): Promise<void> {
  switch (item.type) {
    case "lost_person":
      await apiClient.post("/api/lost-persons", item.payload);
      break;
    case "shuttle_checkin":
      await apiClient.post("/api/shuttles/checkin", item.payload);
      break;
    default:
      logger.warn("Unknown queued item type", { type: item.type });
  }
}

/** Attach online/offline listeners for auto-sync */
export function initSyncListeners(): () => void {
  if (typeof window === "undefined" || listenerAttached) {
    return () => {};
  }

  const handleOnline = () => {
    logger.info("Network restored, syncing offline queue...");
    syncOfflineQueue();
  };

  window.addEventListener("online", handleOnline);
  listenerAttached = true;

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    listenerAttached = false;
  };
}
