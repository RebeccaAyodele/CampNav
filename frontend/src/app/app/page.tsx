/**
 * Visitor Map Screen (/app/page.tsx)
 * Centered on Redemption City, offline-capable, features search (online API or local Fuse.js),
 * geolocation, voice search integration, and a premium slide-up details sheet for directions.
 */

"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Fuse from "fuse.js";
import { useTranslation } from "react-i18next";
import { Search, Navigation, LocateFixed, Mic, AlertCircle, MapPin, X, ArrowRight } from "lucide-react";

import { getPOIs, type GeoJSONPointFeature } from "@/data/campGeoJSON";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useMounted } from "@/hooks/useMounted";
import { apiClient } from "@/lib/api";
import { startVoiceRecognition, isSpeechRecognitionSupported } from "@/lib/speechEngine";

const DEFAULT_CENTER: [number, number] = [3.4588, 6.8097]; // Redemption City [lng, lat]
const DEFAULT_ZOOM = 14;

const CATEGORY_COLORS: Record<string, string> = {
  parking: "#3B82F6",       // Blue
  religion: "#8B5CF6",      // Purple
  commerce: "#F97316",      // Orange
  residential: "#10B981",   // Green
  accommodation: "#06B6D4", // Cyan
  finance: "#EAB308",       // Yellow
  recreation: "#84CC16",    // Lime
  education: "#6366F1",     // Indigo
  medical: "#EF4444",       // Red
  services: "#64748B",      // Slate
};

interface POIData {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
  zone?: string | null;
}

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { mode } = useNetworkStatus();
  const mounted = useMounted();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<POIData[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POIData | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Fuse.js for offline fuzzy search
  const localPOIs = useMemo(() => {
    return getPOIs().map((poi) => ({
      id: poi.properties.id,
      name: poi.properties.name,
      category: poi.properties.category || "services",
      lat: poi.geometry.coordinates[1],
      lng: poi.geometry.coordinates[0],
      description: poi.properties.zone ? `Zone ${poi.properties.zone}` : undefined,
      zone: poi.properties.zone,
    }));
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(localPOIs, {
      keys: ["name", "category", "description"],
      threshold: 0.3,
    });
  }, [localPOIs]);

  // Read search query from URL (e.g., set by voice search redirect)
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setSearchQuery(urlQuery);
      handleSearchSubmit(urlQuery);
    }
  }, [searchParams]);

  // Search execution
  const handleSearchSubmit = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (mode === "online") {
      try {
        const response = await apiClient.get<{ success: boolean; data: { results: any[] } }>(
          `/api/route/search?q=${encodeURIComponent(query)}`
        );
        if (response.success && response.data?.results) {
          const formatted = response.data.results.map((res: any) => ({
            id: res.id,
            name: res.name,
            category: res.type || "services",
            lat: res.lat,
            lng: res.lng,
            description: res.description,
            zone: res.zone || null,
          }));
          setSearchResults(formatted.slice(0, 10));
        } else {
          runOfflineFallbackSearch(query);
        }
      } catch (err) {
        runOfflineFallbackSearch(query);
      }
    } else {
      runOfflineFallbackSearch(query);
    }
  };

  const runOfflineFallbackSearch = (query: string) => {
    const fuseResults = fuse.search(query);
    setSearchResults(fuseResults.map((r) => r.item).slice(0, 10));
  };

  // Run search when query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchSubmit(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  // Map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);

      // Add source for POIs
      map.addSource("pois", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: getPOIs() as any,
        },
      });

      // Add circle layer with colors mapped to category
      const colorMatchExpression: any[] = ["match", ["get", "category"]];
      Object.entries(CATEGORY_COLORS).forEach(([cat, color]) => {
        colorMatchExpression.push(cat, color);
      });
      colorMatchExpression.push("#64748B"); // Fallback color

      map.addLayer({
        id: "poi-circles",
        type: "circle",
        source: "pois",
        paint: {
          "circle-color": colorMatchExpression as any,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            5,
            16,
            10,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.35)",
          "circle-opacity": 0.92,
        },
      });

      // Interactive clicks on markers
      map.on("click", "poi-circles", (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties as any;
          const coords = (feature.geometry as any).coordinates;
          const poi: POIData = {
            id: props.id,
            name: props.name,
            category: props.category || "services",
            lat: coords[1],
            lng: coords[0],
            zone: props.zone || null,
          };
          handleSelectPOI(poi);
        }
      });

      map.on("mouseenter", "poi-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "poi-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    // Try to get user location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(coords);
        },
        null,
        { enableHighAccuracy: true }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleSelectPOI = (poi: POIData) => {
    setSelectedPOI(poi);
    setSearchResults([]);

    mapRef.current?.flyTo({
      center: [poi.lng, poi.lat],
      zoom: 16,
      essential: true,
    });
  };

  const locateUser = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        mapRef.current?.flyTo({
          center: coords,
          zoom: 16,
          essential: true,
        });

        // Add temporary user location marker if loaded
        if (mapRef.current) {
          const el = document.getElementById("user-loc-marker") || document.createElement("div");
          el.id = "user-loc-marker";
          el.className = "h-4 w-4 bg-orange-600 border-2 border-white rounded-full shadow-md animate-pulse";
          
          new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(mapRef.current);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true }
    );
  };

  const startVoice = () => {
    setIsListening(true);
    startVoiceRecognition(
      i18n.language,
      (res) => {
        setIsListening(false);
        setSearchQuery(res.transcript);
        handleSearchSubmit(res.transcript);
      },
      () => setIsListening(false),
      () => setIsListening(false)
    );
  };

  const getDirectionsURL = () => {
    if (!selectedPOI) return "";
    const olat = userLocation ? userLocation[1] : DEFAULT_CENTER[1];
    const olng = userLocation ? userLocation[0] : DEFAULT_CENTER[0];
    return `/app/directions/${selectedPOI.id}?olat=${olat}&olng=${olng}&dlat=${selectedPOI.lat}&dlng=${selectedPOI.lng}&name=${encodeURIComponent(selectedPOI.name)}`;
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Top Search Bar Card */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 p-1.5 flex items-center gap-1.5 transition-all">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-slate-50 border-0 pl-8 pr-7 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {mounted && isSpeechRecognitionSupported() && (
            <button
              onClick={startVoice}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
              title={t("voiceSearch")}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/30 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {searchResults.map((poi) => (
              <button
                key={poi.id}
                onClick={() => handleSelectPOI(poi)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50/60 rounded-xl mx-1 my-0.5 transition-colors"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[poi.category] || "#64748B" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {poi.name}
                  </p>
                  <p className="text-xs text-slate-400 capitalize font-medium">
                    {t(poi.category)} {poi.zone ? `• Zone ${poi.zone}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 h-full w-full" />

      {/* Floating Action Buttons */}
      <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-3">
        <button
          onClick={locateUser}
          className="p-3.5 bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          title={t("currentLocation")}
        >
          <LocateFixed className="h-5.5 w-5.5" />
        </button>
      </div>

      {/* Selected Location Slide-up Bottom Sheet */}
      {selectedPOI && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span
                  className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full mb-2 text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[selectedPOI.category] || "#64748B" }}
                >
                  {t(selectedPOI.category)}
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedPOI.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPOI(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedPOI.description && (
              <p className="text-sm text-slate-500 font-medium mb-4">
                {selectedPOI.description}
              </p>
            )}

            <button
              onClick={() => router.push(getDirectionsURL())}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#ff6b00] hover:bg-orange-900 text-white rounded-xl font-bold shadow-lg shadow-[#ff6b00]/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              <Navigation className="h-5 w-5" />
              <span>{t("getDirections")}</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitorMapPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading map...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}
