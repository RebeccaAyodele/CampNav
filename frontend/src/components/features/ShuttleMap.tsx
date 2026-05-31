/**
 * ShuttleMap Component
 *
 * Purpose:
 *   - Dashboard map showing all active shuttles
 *   - Displays shuttle positions as pins with vehicle IDs
 *   - Shows lost person report locations
 *   - Real-time updates of positions
 *
 * Props:
 *   - shuttles: Array<Shuttle> — array of shuttle objects with location data
 *   - lostPersons?: Array<LostPersonReport> — optional array of lost person reports
 *   - onShuttleClick?: (shuttleId: string) => void — callback for shuttle selection
 */

import type { Shuttle } from "@/types";

interface ShuttleMapProps {
  shuttles: Shuttle[];
  lostPersons?: Array<{ id: string; location: { lat: number; lng: number } }>;
  onShuttleClick?: (shuttleId: string) => void;
}

export default function ShuttleMap({
  shuttles,
  lostPersons = [],
  onShuttleClick,
}: ShuttleMapProps): JSX.Element {
  return (
    <div className="w-full h-full relative bg-surface flex items-center justify-center">
      {/* Map Placeholder */}
      <div className="text-center space-y-2 text-text-secondary">
        <p className="text-lg">🗺️</p>
        <p className="text-sm">Dashboard map with {shuttles.length} shuttles</p>
        <p className="text-xs text-text-muted">
          Showing shuttle positions (🚌) and lost person reports (👤)
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg border border-border p-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span>🚌</span>
          <span>Shuttles ({shuttles.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👤</span>
          <span>Lost persons ({lostPersons.length})</span>
        </div>
      </div>

      {/* TODO: Implement MapLibre GL initialization */}
      {/* TODO: Render shuttle markers with real-time updates */}
      {/* TODO: Render lost person report pins */}
      {/* TODO: Implement WebSocket updates for live tracking */}
      {/* TODO: Add shuttle detail popup on click */}
    </div>
  );
}
