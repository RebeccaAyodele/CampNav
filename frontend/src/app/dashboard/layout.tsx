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
      <div className="dash-shell flex h-screen items-center justify-center">
        <div className="h-10 w-10 border-4 border-[var(--dashboard-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dash-shell flex h-screen w-screen overflow-hidden font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation drawer */}
      <aside
        className={`dash-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-24 items-center justify-between px-5 border-b dash-divider shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[var(--dashboard-accent)] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-black uppercase leading-tight text-[var(--dashboard-accent-dark)]">
                Command<br />Center
              </span>
              <span className="text-[10px] font-bold text-[var(--dashboard-muted)]">Lead Coordinator</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-[var(--dashboard-panel-muted)] lg:hidden text-[var(--dashboard-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-4 border-b dash-divider shrink-0 flex items-center gap-3">
          <div className="h-9 w-9 border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-panel)] flex items-center justify-center font-extrabold text-[var(--dashboard-accent-dark)]">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{adminName}</p>
            <p className="dash-label mt-0.5">Control Center</p>
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
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-[var(--dashboard-active)] text-[var(--dashboard-text)]"
                    : "text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-panel)] hover:text-[var(--dashboard-text)]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t dash-divider shrink-0 space-y-3">
          {/* WebSocket Status Indicator */}
          <div className="dash-panel-muted flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Radio className={`h-4.5 w-4.5 ${wsConnected ? "text-[var(--dashboard-success)]" : "text-[var(--dashboard-alert)]"}`} />
              <span className="text-xs font-bold">Logistics Link</span>
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${
                wsConnected ? "bg-[color-mix(in_srgb,var(--dashboard-success)_14%,white)] text-[var(--dashboard-success)]" : "bg-[color-mix(in_srgb,var(--dashboard-alert)_12%,white)] text-[var(--dashboard-alert)]"
              }`}
            >
              {wsConnected ? t("connected") : t("disconnected")}
            </span>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="dash-button-secondary w-full flex items-center justify-center gap-2 px-4 py-3 text-sm active:scale-[0.98]"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header navbar */}
        <header className="dash-sidebar relative z-30 flex h-20 items-center justify-between border-b px-6 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-[var(--dashboard-panel-muted)] text-[var(--dashboard-text)]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-5.5 w-5.5 text-[var(--dashboard-accent)]" />
              <span className="font-extrabold text-base tracking-wider text-[var(--dashboard-accent-dark)]">
                CampNav HQ
              </span>
            </div>
          </div>
          
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--dashboard-success)]" />
        </header>

        {/* Content canvas */}
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
