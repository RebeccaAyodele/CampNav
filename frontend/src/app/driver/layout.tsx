/**
 * Driver Portal Layout (/driver/layout.tsx)
 * Minimal wrapper with online/offline badge and translation initialization.
 */

"use client";

import "@/lib/i18n";
import React from "react";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { mode, queueCount } = useNetworkStatus();

  return (
    <div className="flex flex-col h-screen bg-[#0D1B4B] text-white antialiased overflow-hidden">
      {/* Simple Header */}
      <header className="border-b border-white/10 bg-[#071133] px-5 py-4 shrink-0 flex items-center justify-between shadow-lg z-10">
        <h1 className="text-base font-extrabold tracking-wide text-blue-200">
          {t("driverCheckin")}
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Offline/Online Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              mode === "online"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
            }`}
          >
            {mode === "online" ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>{t("online")}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>{t("offline")}</span>
              </>
            )}
          </div>

          {/* Sync Count Badge */}
          {queueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{queueCount}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative bg-[#0D1B4B]">
        {children}
      </main>
    </div>
  );
}
