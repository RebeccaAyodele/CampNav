/**
 * Service Worker Registration Stub
 *
 * Purpose:
 *   - Registers the service worker for offline caching
 *   - Handles PWA lifecycle events
 *   - Manages update notifications
 *
 * Usage:
 *   import { registerServiceWorker } from "@/lib/serviceWorker";
 *   registerServiceWorker();
 */

export async function registerServiceWorker(): Promise<void> {
  // Only register in browser environment
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration);

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New service worker is ready
            console.log("New Service Worker version available");
            // Show update notification to user
          }
        });
      }
    });
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

/**
 * Unregister all service workers
 * Useful for debugging or forcing a clean state
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
}
