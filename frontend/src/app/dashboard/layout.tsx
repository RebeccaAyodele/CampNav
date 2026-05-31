/**
 * Dashboard Layout (/dashboard/layout.tsx)
 *
 * Purpose:
 *   - Wraps all admin dashboard pages
 *   - Provides persistent navigation structure
 *   - Shows sidebar or top navigation
 *
 * Components that will go here:
 *   - Sidebar navigation menu
 *   - User profile dropdown
 *   - Logout button
 *   - Top navigation bar
 *   - Breadcrumb navigation
 */

import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps): JSX.Element {
  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar Navigation Placeholder */}
      <aside className="hidden sm:flex w-64 flex-col border-r border-border bg-white">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-bold text-primary-900">CampNav Admin</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-auto p-4">
          <a
            href="/dashboard"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-50 transition-colors"
          >
            📊 Overview
          </a>
          <a
            href="/dashboard/shuttles"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 transition-colors"
          >
            🚌 Shuttles
          </a>
          <a
            href="/dashboard/emergency-routing"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 transition-colors"
          >
            🚨 Emergency Routing
          </a>
          <a
            href="/dashboard/supply-routes"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 transition-colors"
          >
            📦 Supply Routes
          </a>
          <a
            href="/dashboard/lost-persons"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 transition-colors"
          >
            👤 Lost Persons
          </a>
          <a
            href="/dashboard/reports"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-primary-50 transition-colors"
          >
            📋 Activity Log
          </a>
        </nav>

        <div className="border-t border-border p-4">
          <button className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-50 transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar for Mobile */}
        <div className="sm:hidden border-b border-border bg-white p-3">
          <h1 className="text-lg font-bold text-primary-900">CampNav</h1>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
