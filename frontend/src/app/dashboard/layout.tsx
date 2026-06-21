/**
 * Admin Dashboard Layout (/dashboard/layout.tsx)
 * Features Auth Guard, sidebar navigation, responsive layout, WebSocket logistics room subscription,
 * and live connection status indicators.
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Bus, Users, LogOut, Activity, Menu, X, Shield, Radio } from "lucide-react";

import { apiClient } from "@/lib/api";
import { getSocket, connectSocket, disconnectSocket, joinRoom } from "@/lib/socketClient";

interface SidebarItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");

  // Auth Guard
  useEffect(() => {
    if (pathname === "/dashboard/login") {
      return;
    }
    const token = localStorage.getItem("authToken");
    const adminUserJson = localStorage.getItem("adminUser");
    
    if (!token) {
      window.location.href = "/dashboard/login";
    } else {
      setIsAuthorized(true);
      if (adminUserJson) {
        try {
          const user = JSON.parse(adminUserJson);
          if (user.name) setAdminName(user.name);
        } catch (_) {}
      }
    }
  }, [pathname]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!isAuthorized) return;

    connectSocket();
    joinRoom("logistics");

    const s = getSocket();
    setWsConnected(s.connected);

    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      disconnectSocket();
    };
  }, [isAuthorized]);

  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (_) {}
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/dashboard/login";
  };

  const menuItems: SidebarItem[] = [
    { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/shuttles", labelKey: "shuttleManagement", icon: Bus },
    { href: "/dashboard/lost-persons", labelKey: "lostPersonReports", icon: Users },
  ];

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#071133] text-white">
        <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#071133] border-r border-white/5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-400" />
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-orange-400 to-indigo-200 bg-clip-text text-transparent">
              CampNav HQ
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden text-white/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 py-5 border-b border-white/5 shrink-0 flex items-center gap-3 bg-[#0a1847]/30">
          <div className="h-10 w-10 rounded-full bg-orange-600/35 border border-orange-500/25 flex items-center justify-center font-extrabold text-orange-300">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">{adminName}</p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 mt-0.5">Control Center</p>
          </div>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                  isActive
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/15"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-white/5 shrink-0 space-y-3 bg-[#0a1847]/10">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center justify-between bg-[#071133] border border-white/5 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Radio className={`h-4.5 w-4.5 ${wsConnected ? "text-emerald-400 animate-pulse" : "text-rose-500"}`} />
              <span className="text-xs font-bold text-slate-300">Logistics Link</span>
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                wsConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {wsConnected ? t("connected") : t("disconnected")}
            </span>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:border-white/25 text-rose-400 hover:text-rose-300 text-sm font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950 text-slate-200">
        {/* Mobile Header navbar */}
        <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#071133] px-6 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-white/10 text-slate-300"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-5.5 w-5.5 text-orange-400" />
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-orange-400 to-indigo-200 bg-clip-text text-transparent">
                CampNav HQ
              </span>
            </div>
          </div>
          
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
        </header>

        {/* Content canvas */}
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
