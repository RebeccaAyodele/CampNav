/**
 * Dashboard Overview (/dashboard)
 *
 * Purpose:
 *   - Main dashboard view showing key metrics
 *   - Map in center with shuttle positions and lost person pins
 *   - Summary panel showing: active shuttles, open lost person cases
 *   - Links to detailed views
 *
 * Components that will go here:
 *   - ShuttleMap.tsx — map with shuttle pins
 *   - Summary cards (active shuttles, open cases)
 *   - Map with legend
 *   - Quick action buttons
 */

"use client";

export default function DashboardPage(): JSX.Element {
  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real-time overview of event logistics and operations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-medium text-text-secondary">Active Shuttles</p>
          <p className="mt-2 text-3xl font-bold text-primary-900">12</p>
          <p className="mt-1 text-xs text-success-base">+ 2 in last hour</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-medium text-text-secondary">Lost Person Cases</p>
          <p className="mt-2 text-3xl font-bold text-primary-900">3</p>
          <p className="mt-1 text-xs text-warning-base">1 in last 30 min</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-medium text-text-secondary">Total Check-ins</p>
          <p className="mt-2 text-3xl font-bold text-primary-900">287</p>
          <p className="mt-1 text-xs text-info-base">This session</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-medium text-text-secondary">Offline Users</p>
          <p className="mt-2 text-3xl font-bold text-primary-900">156</p>
          <p className="mt-1 text-xs text-text-muted">Currently offline</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-lg border border-border bg-surface flex items-center justify-center">
        <div className="text-center space-y-2 text-text-secondary">
          <p className="text-lg">🗺️</p>
          <p className="text-sm">Interactive map placeholder</p>
          <p className="text-xs text-text-muted">
            Shows shuttle positions (🚌) and lost person reports (👤)
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <button className="rounded-lg border-2 border-accent-500 bg-white px-6 py-3 font-semibold text-accent-500 hover:bg-accent-50 transition-colors">
          📍 View Shuttles
        </button>
        <button className="rounded-lg border-2 border-error-base bg-white px-6 py-3 font-semibold text-error-base hover:bg-error-light transition-colors">
          👤 View Lost Persons
        </button>
      </div>
    </div>
  );
}
