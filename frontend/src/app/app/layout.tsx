/**
 * Visitor App Layout (/app/layout.tsx)
 *
 * Purpose:
 *   - Wraps all visitor app pages
 *   - Provides persistent navigation structure
 *   - Manages language context
 *
 * Components that will go here:
 *   - Bottom navigation bar with icons (Home, Search, Report, Emergency)
 *   - Language toggle
 *   - Offline indicator
 *   - Geolocation permissions manager
 */

import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom Navigation Placeholder */}
      <nav className="border-t border-border bg-surface">
        <div className="container mx-auto flex justify-around items-center py-3">
          {/* Home */}
          <button className="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary-900 transition-colors">
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </button>

          {/* Search */}
          <button className="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary-900 transition-colors">
            <span className="text-xl">🔍</span>
            <span className="text-xs">Search</span>
          </button>

          {/* Report */}
          <button className="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-primary-900 transition-colors">
            <span className="text-xl">📝</span>
            <span className="text-xs">Report</span>
          </button>

          {/* Emergency */}
          <button className="flex flex-col items-center gap-1 p-2 text-accent-500 hover:text-accent-600 transition-colors">
            <span className="text-xl">🚨</span>
            <span className="text-xs">Emergency</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
