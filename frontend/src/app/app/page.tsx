/**
 * Main Map Screen (/app)
 *
 * Purpose:
 *   - Full-screen offline map display
 *   - Search bar at top
 *   - Language toggle button
 *   - Navigation to search, report, and emergency pages
 *
 * Components that will go here:
 *   - MapView.tsx — MapLibre GL map container
 *   - SearchBar.tsx — search input with language toggle
 *   - Location permission request
 *   - Offline indicator
 *   - Current location indicator/button
 */

"use client";

export default function AppMapPage(): JSX.Element {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search Bar */}
      <div className="bg-white border-b border-border p-3 shadow-sm">
        <div className="container mx-auto flex gap-2 items-center">
          {/* Search Input Placeholder */}
          <input
            type="text"
            placeholder="Search locations..."
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          />

          {/* Language Toggle Placeholder */}
          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary-900 hover:bg-white transition-colors"
          >
            EN
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-surface">
        {/* MapView component will go here */}
        <div className="w-full h-full flex items-center justify-center text-text-secondary">
          <div className="text-center space-y-2">
            <p className="text-lg">🗺️</p>
            <p className="text-sm">Map placeholder</p>
            <p className="text-xs text-text-muted">
              MapLibre GL map will render here
            </p>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          className="absolute bottom-4 right-4 rounded-full bg-white p-3 text-xl shadow-md hover:shadow-lg transition-shadow"
          title="Current location"
        >
          📍
        </button>

        {/* Offline Indicator */}
        <div className="absolute top-4 left-4 rounded-lg bg-warning-light px-3 py-2 text-xs font-medium text-warning-dark hidden">
          Currently offline
        </div>
      </div>
    </div>
  );
}
