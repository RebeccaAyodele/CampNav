/**
 * Main Map Screen (/app)
 *
 * Purpose:
 *   - Full-screen offline map display
 *   - Search bar at top
 *   - Language toggle button
 *   - Navigation to search, report, and emergency pages
 */

"use client";

import { useEffect, useMemo, useRef, useState, ReactElement } from "react";
import maplibregl from "maplibre-gl";
import { LocateFixed, Search } from "lucide-react";
import { campLocations, type CampLocationCategory } from "@/data/campLocations";

type CampFeature = {
  type: "Feature";
  properties: {
    id?: string;
    name: string;
    category: CampLocationCategory;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type CampGeoJSON = {
  type: "FeatureCollection";
  features: CampFeature[];
};

const mapCenter: [number, number] = [3.4588, 6.8097];

const categoryColors: Record<CampLocationCategory, string> = {
  parking: "#2563eb",
  religion: "#7c3aed",
  commerce: "#ea580c",
  residential: "#16a34a",
  accommodation: "#0891b2",
  finance: "#ca8a04",
  recreation: "#65a30d",
  education: "#4f46e5",
  medical: "#dc2626",
  services: "#475569",
};

const categoryColorExpression: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "category"],
  "parking",
  categoryColors.parking,
  "religion",
  categoryColors.religion,
  "commerce",
  categoryColors.commerce,
  "residential",
  categoryColors.residential,
  "accommodation",
  categoryColors.accommodation,
  "finance",
  categoryColors.finance,
  "recreation",
  categoryColors.recreation,
  "education",
  categoryColors.education,
  "medical",
  categoryColors.medical,
  "services",
  categoryColors.services,
  "#475569",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function AppMapPage(): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [query, setQuery] = useState("");

  const filteredLocations = useMemo(() => {
  const normalizedQuery = query.trim().toLowerCase();

  const features = (campLocations as CampGeoJSON).features;

  if (!normalizedQuery) {
    return features.slice(0, 6);
  }

  return features
    .filter((feature: CampFeature) => {
      const { name, category } = feature.properties;

      return (
        name.toLowerCase().includes(normalizedQuery) ||
        category.toLowerCase().includes(normalizedQuery)
      );
    })
    .slice(0, 6);
}, [query]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: mapCenter,
      zoom: 13,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("camp-locations", {
        type: "geojson",
        data: campLocations,
      });

      map.addLayer({
        id: "camp-location-points",
        type: "circle",
        source: "camp-locations",
        paint: {
          "circle-color": categoryColorExpression,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 5, 15, 9],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "camp-location-labels",
        type: "symbol",
        source: "camp-locations",
        minzoom: 14,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular"],
          "text-offset": [0, 1.2],
          "text-size": 12,
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#1f2937",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      const bounds = new maplibregl.LngLatBounds();
      campLocations.features.forEach((feature: CampFeature) => {
        bounds.extend(feature.geometry.coordinates);
      });
      map.fitBounds(bounds, { padding: 64, maxZoom: 14 });
    });

    map.on("click", "camp-location-points", (event) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") {
        return;
      }

      const coordinates = feature.geometry.coordinates as [number, number];
      const name = String(feature.properties?.name ?? "Camp location");
      const category = feature.properties.category as CampLocationCategory;

      new maplibregl.Popup({ closeButton: true, offset: 16 })
        .setLngLat(coordinates)
        .setHTML(
          `<strong>${escapeHtml(name)}</strong><br/><span>${escapeHtml(category)}</span>`,
        )
        .addTo(map);
    });

    map.on("mouseenter", "camp-location-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "camp-location-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function flyToLocation(coordinates: [number, number]): void {
    mapRef.current?.flyTo({
      center: coordinates,
      zoom: 16,
      essential: true,
    });
  }

  function locateUser(): void {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 16,
        essential: true,
      });
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="z-10 border-b border-border bg-white p-3 shadow-sm">
        <div className="container mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search locations..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary-900 transition-colors hover:bg-white"
          >
            EN
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={mapContainerRef} className="h-full w-full" />

        {query.trim() ? (
          <div className="absolute left-3 right-3 top-3 z-10 max-h-64 overflow-auto rounded-xl border border-border bg-white p-2 shadow-lg sm:left-4 sm:right-auto sm:w-96">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((feature: CampFeature) => (
                <button
                  key={feature.properties.id}
                  type="button"
                  onClick={() => flyToLocation(feature.geometry.coordinates)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryColors[feature.properties.category] }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-primary-900">
                      {feature.properties.name}
                    </span>
                    <span className="block text-xs capitalize text-text-muted">
                      {feature.properties.category}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-text-muted">No matching locations.</p>
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={locateUser}
          className="absolute bottom-4 right-4 z-10 rounded-full bg-white p-3 text-primary-900 shadow-md transition-shadow hover:shadow-lg"
          title="Current location"
        >
          <LocateFixed aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="absolute left-4 top-4 hidden rounded-lg bg-warning-light px-3 py-2 text-xs font-medium text-warning-dark">
          Currently offline
        </div>
      </div>
    </div>
  );
}
