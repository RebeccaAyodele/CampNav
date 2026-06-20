/**
 * Visitor App Layout (/app/layout.tsx)
 * Implements bottom navigation, language switcher, voice search, and network/sync indicators.
 */

"use client";

import "@/lib/i18n";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Home, Search, MessageSquareWarning, Siren, Mic, RefreshCw, Globe, Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { startVoiceRecognition, isSpeechRecognitionSupported } from "@/lib/speechEngine";

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isOnline, mode, queueCount } = useNetworkStatus();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const currentLang = i18n.language || "en";

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang);
    }
    setLangDropdownOpen(false);
  };

  const triggerVoiceSearch = () => {
    setVoiceError(null);
    setIsListening(true);
    const recognition = startVoiceRecognition(
      currentLang,
      (result) => {
        setIsListening(false);
        if (result.transcript) {
          router.push(`/app?q=${encodeURIComponent(result.transcript)}`);
        }
      },
      (error) => {
        setVoiceError(error);
        setTimeout(() => setIsListening(false), 2000);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!recognition) {
      setIsListening(false);
    }
  };

  const navItems = [
    { href: "/app", label: t("home"), icon: Home },
    { href: "/app/report", label: t("report"), icon: MessageSquareWarning },
    { href: "/app/emergency", label: t("emergency"), icon: Siren },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0D1B4B] text-white shadow-md z-30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
            CampNav
          </span>
          {/* Offline/Online Status Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm transition-colors ${
              mode === "online"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
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

          {/* Sync Queue Badge */}
          {queueCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{queueCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Search Trigger */}
          {isSpeechRecognitionSupported() && (
            <button
              onClick={triggerVoiceSearch}
              className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-all text-blue-200 hover:text-white"
              title={t("voiceSearch")}
            >
              <Mic className="h-5 w-5" />
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
            >
              <Globe className="h-4 w-4 text-blue-200" />
              <span className="uppercase">{currentLang}</span>
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white text-slate-800 shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { code: "en", name: "English" },
                    { code: "yo", name: "Yoruba" },
                    { code: "ha", name: "Hausa" },
                    { code: "ig", name: "Igbo" },
                    { code: "fr", name: "Français" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors font-medium ${
                        currentLang === lang.code
                          ? "text-blue-600 bg-blue-50/50"
                          : "text-slate-700"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative overflow-hidden bg-slate-50">
        {children}

        {/* Voice Search / Listening Dialog Overlay */}
        {isListening && (
          <div className="absolute inset-0 bg-[#0D1B4B]/95 z-50 flex flex-col items-center justify-center text-white px-6 transition-all duration-300">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute h-24 w-24 rounded-full bg-blue-500/20 animate-ping" />
              <div className="absolute h-16 w-16 rounded-full bg-blue-500/40 animate-pulse" />
              <button
                onClick={() => setIsListening(false)}
                className="relative bg-blue-600 text-white p-5 rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30"
              >
                <Mic className="h-8 w-8" />
              </button>
            </div>
            <p className="text-xl font-bold tracking-wide mb-2">
              {voiceError ? t("error") : t("listening")}
            </p>
            <p className="text-sm text-blue-200 text-center max-w-xs">
              {voiceError || t("voiceSearch")}
            </p>
            <button
              onClick={() => setIsListening(false)}
              className="mt-12 px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-semibold"
            >
              {t("cancel")}
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation Menu */}
      <nav className="bg-white border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-30 shrink-0">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 px-6 transition-all relative ${
                  isActive
                    ? "text-[#0D1B4B] scale-105"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className={`h-6.5 w-6.5 transition-transform duration-200 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? "text-[#0D1B4B]" : "text-slate-400"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#0D1B4B]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
