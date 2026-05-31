/**
 * Driver Layout (/driver/layout.tsx)
 *
 * Purpose:
 *   - Wraps driver check-in page
 *   - Minimal navigation (only back button)
 *   - Battery indicator
 *   - Offline status
 *
 * Components that will go here:
 *   - Simple header with vehicle ID
 *   - Battery/signal indicators
 *   - Time display
 */

import type { ReactNode } from "react";

interface DriverLayoutProps {
  children: ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps): JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-900">Driver Check-in</h1>
          <div className="flex gap-2 text-sm text-text-secondary">
            <span>🔋 85%</span>
            <span>📶 Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">{children}</main>
    </div>
  );
}
