/**
 * MapView Component
 *
 * Purpose:
 *   - Wraps MapLibre GL for offline map display
 *   - Handles map initialization, state management, and user interactions
 *   - Supports pinning locations, drawing routes, and geolocation
 *
 * Props:
 *   - center?: Coordinates — initial map center
 *   - zoom?: number — initial zoom level
 *   - onLocationSelect?: (location: Coordinates) => void — callback when user clicks map
 *   - markers?: Array<{id, location, title}> — pins to display
 *   - routes?: Array<Route> — routes to draw on map
 */

import type { Coordinates, Route } from "@/types";

interface MapViewProps {
  center?: Coordinates;
  zoom?: number;
  onLocationSelect?: (location: Coordinates) => void;
  markers?: Array<{
    id: string;
    location: Coordinates;
    title: string;
    icon?: string;
  }>;
  routes?: Route[];
}

export default function MapView({
  center,
  zoom = 13,
  onLocationSelect,
  markers = [],
  routes = [],
}: MapViewProps): JSX.Element {
  // MapLibre GL initialization and rendering will go here
  return (
    <div
      className="w-full h-full bg-surface flex items-center justify-center relative"
      onClick={() => {
        // Map click handler will go here
        if (onLocationSelect) {
          // onLocationSelect({lat: event.lngLat.lat, lng: event.lngLat.lng});
        }
      }}
    >
      <div className="text-center space-y-2 text-text-secondary">
        <p className="text-lg">🗺️</p>
        <p className="text-sm">MapLibre GL map</p>
        <p className="text-xs text-text-muted">
          Showing {markers.length} markers, {routes.length} routes
        </p>
      </div>

      {/* TODO: Implement MapLibre GL initialization */}
      {/* TODO: Render markers array */}
      {/* TODO: Render routes array */}
      {/* TODO: Handle user interactions (click, pan, zoom) */}
    </div>
  );
}
