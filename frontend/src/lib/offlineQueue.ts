/**
 * IndexedDB-backed offline queue for form submissions.
 * Stores payloads when offline; drains them when connectivity returns.
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "campnav-offline";
const DB_VERSION = 1;
const STORE_NAME = "queue";

export interface QueuedItem {
  id?: number;
  type: "lost_person" | "shuttle_checkin";
  payload: Record<string, unknown>;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/** Add an item to the offline queue */
export async function enqueue(type: QueuedItem["type"], payload: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, {
    type,
    payload,
    timestamp: Date.now(),
  });
}

/** Get all queued items */
export async function getAll(): Promise<QueuedItem[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/** Remove a specific item by ID */
export async function remove(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/** Clear all queued items */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

/** Get count of queued items */
export async function getCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}
