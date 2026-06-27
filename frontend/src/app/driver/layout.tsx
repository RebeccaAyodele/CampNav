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
    <div className="flex flex-col h-screen bg-white text-slate-800 antialiased overflow-hidden">
      {/* Simple Header */}
      <header className="border-b border-slate-200/80 bg-white px-5 py-4 shrink-0 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-base font-black tracking-wide text-orange-600">
          {t("driverCheckin")}
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Offline/Online Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              mode === "online"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{queueCount}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative bg-transparent">
        {children}
      </main>
    </div>
  );
}
