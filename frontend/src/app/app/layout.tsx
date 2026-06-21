/**
 * Visitor App Layout (/app/layout.tsx)
 *
 * Fixes applied:
 *  1. Hydration mismatch — isSpeechRecognitionSupported() now guarded by useMounted
 *     so server + first-client render are identical (both render nothing for the mic button).
 *  2. Online/offline flicker — useNetworkStatus no longer polls the backend.
 *  3. Premium header — redesigned to match the landing page's dark/glassmorphism aesthetic.
 *  4. PWA install — shows a smart install banner that only appears when the app is
 *     installable AND not already installed.
 */

"use client";

import "@/lib/i18n";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Home,
  MessageSquareWarning,
  Siren,
  Mic,
  RefreshCw,
  Globe,
  Wifi,
  WifiOff,
  Download,
  X,
  Smartphone,
} from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useMounted } from "@/hooks/useMounted";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { startVoiceRecognition, isSpeechRecognitionSupported } from "@/lib/speechEngine";

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isOnline, mode, queueCount } = useNetworkStatus();
  const mounted = useMounted();
  const { canInstall, isInstalled, install, dismiss, dismissed } = usePWAInstall();

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

  const handleInstall = async () => {
    await install();
  };

  const navItems = [
    { href: "/app", label: t("home"), icon: Home },
    { href: "/app/report", label: t("report"), icon: MessageSquareWarning },
    { href: "/app/emergency", label: t("emergency"), icon: Siren },
  ];

  // Whether to show the PWA install banner:
  // - must be mounted (client-only)
  // - app must be installable (beforeinstallprompt fired)
  // - app must NOT already be installed
  // - user must not have dismissed the banner this session
  const showInstallBanner = mounted && canInstall && !isInstalled && !dismissed;

  return (
    <div className="flex flex-col h-screen text-slate-800 antialiased overflow-hidden" style={{ background: "#f8f7f5" }}>

      {/* ── Premium Dark Header ── */}
      <header
        className="relative flex items-center justify-between px-4 py-0 z-30 shrink-0 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1c1e 0%, #2d1a0e 60%, #3a1f05 100%)",
          minHeight: "56px",
        }}
      >
        {/* Subtle orange glow accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(255,107,0,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Left: Logo + Status */}
        <div className="relative flex items-center gap-2.5">
          <Link href="/app" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6b00] text-xs font-black text-white shadow-lg shadow-[#ff6b00]/30 group-hover:scale-105 transition-transform">
              CN
            </span>
            <span className="text-base font-black tracking-tight text-white">
              CampNav
            </span>
          </Link>

          {/* Online / Offline badge — only rendered after mount to prevent hydration mismatch */}
          {mounted && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all duration-500 ${
                mode === "online"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/25 animate-pulse"
              }`}
            >
              {mode === "online" ? (
                <>
                  <Wifi className="h-2.5 w-2.5" />
                  <span>{t("online")}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-2.5 w-2.5" />
                  <span>{t("offline")}</span>
                </>
              )}
            </div>
          )}

          {/* Sync queue badge */}
          {mounted && queueCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
              <span>{queueCount}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="relative flex items-center gap-1.5">
          {/* Voice search — guarded by mounted to fix hydration mismatch */}
          {mounted && isSpeechRecognitionSupported() && (
            <button
              onClick={triggerVoiceSearch}
              className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all text-orange-200 hover:text-white"
              title={t("voiceSearch")}
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition-colors text-xs font-semibold border border-white/10 text-white"
            >
              <Globe className="h-3.5 w-3.5 text-orange-300" />
              <span className="uppercase">{currentLang}</span>
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[#1a1c1e] border border-white/10 py-1.5 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
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
                      className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-white/8 transition-colors font-medium ${
                        currentLang === lang.code
                          ? "text-[#ff6b00]"
                          : "text-slate-300"
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

      {/* ── PWA Install Banner ── */}
      {showInstallBanner && (
        <div className="relative shrink-0 flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#1a1c1e] to-[#2d1a0e] border-b border-[#ff6b00]/20 z-20">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6b00]/15 border border-[#ff6b00]/30">
            <Smartphone className="h-4 w-4 text-[#ff6b00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-tight">Add CampNav to your phone</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Works offline · No app store needed</p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6b00] hover:bg-[#ff7a1a] text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-[#ff6b00]/20"
          >
            <Download className="h-3 w-3" />
            Install
          </button>
          <button
            onClick={dismiss}
            className="shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-0 relative overflow-hidden" style={{ background: "#f8f7f5" }}>
        {children}

        {/* Voice Search Overlay */}
        {isListening && (
          <div className="absolute inset-0 bg-[#1a1c1e]/97 z-50 flex flex-col items-center justify-center text-white px-6 transition-all duration-300">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute h-24 w-24 rounded-full bg-[#ff6b00]/20 animate-ping" />
              <div className="absolute h-16 w-16 rounded-full bg-[#ff6b00]/30 animate-pulse" />
              <button
                onClick={() => setIsListening(false)}
                className="relative bg-[#ff6b00] text-white p-5 rounded-full hover:bg-orange-500 transition-colors shadow-lg shadow-[#ff6b00]/40"
              >
                <Mic className="h-8 w-8" />
              </button>
            </div>
            <p className="text-xl font-black tracking-wide mb-2">
              {voiceError ? t("error") : t("listening")}
            </p>
            <p className="text-sm text-slate-400 text-center max-w-xs">
              {voiceError || t("voiceSearch")}
            </p>
            <button
              onClick={() => setIsListening(false)}
              className="mt-12 px-6 py-2 rounded-full border border-white/15 hover:bg-white/8 transition-colors text-sm font-semibold text-slate-300"
            >
              {t("cancel")}
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav
        className="shrink-0 z-30"
        style={{
          background: "linear-gradient(0deg, #1a1c1e 0%, #231510 100%)",
          borderTop: "1px solid rgba(255,107,0,0.12)",
        }}
      >
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 px-6 transition-all relative ${
                  isActive ? "scale-105" : ""
                }`}
              >
                <Icon
                  className={`h-6 w-6 transition-all duration-200 ${
                    isActive
                      ? "text-[#ff6b00] stroke-[2.5px]"
                      : "text-slate-500 stroke-[1.8px] hover:text-slate-300"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-wide ${
                    isActive ? "text-[#ff6b00]" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#ff6b00] shadow-lg shadow-[#ff6b00]/50" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
