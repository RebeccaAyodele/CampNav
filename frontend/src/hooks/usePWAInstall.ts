/**
 * usePWAInstall — detects if the app can be installed as a PWA and whether
 * it's already installed, exposing a function to trigger the install prompt.
 *
 * How it works:
 *  - Listens for the browser's `beforeinstallprompt` event, which fires when
 *    Chrome/Edge decides the app is installable AND it's not already installed.
 *    If this event never fires, it means the app is either already installed
 *    or the browser doesn't support PWA installation.
 *  - Detects "already installed" by checking `display-mode: standalone` (the
 *    app is running in its own window) or the iOS `navigator.standalone` flag.
 *
 * Usage:
 *   const { canInstall, isInstalled, install } = usePWAInstall();
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallStatus {
  /** True if the browser fired beforeinstallprompt — i.e. app can be installed */
  canInstall: boolean;
  /** True if the app is already running as an installed PWA */
  isInstalled: boolean;
  /** Call this to show the native install dialog */
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** Dismiss the in-app install banner (user said "not now") */
  dismiss: () => void;
  /** Whether the user has manually dismissed our in-app banner this session */
  dismissed: boolean;
}

function checkIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  // Standard: app is in standalone/fullscreen display mode
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  // iOS Safari: navigator.standalone is true when added to home screen
  if ((navigator as any).standalone === true) return true;
  return false;
}

export function usePWAInstall(): PWAInstallStatus {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check installation state once mounted
    setIsInstalled(checkIsInstalled());

    // Listen for the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault(); // Don't show the mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // If the app gets installed (e.g. user installs via browser menu)
    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    if (outcome === "accepted") setIsInstalled(true);
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return { canInstall, isInstalled, install, dismiss, dismissed };
}
