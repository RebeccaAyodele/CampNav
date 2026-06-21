/**
 * Directions Screen (/app/directions/[id])
 * Shows route on map, lists step-by-step instructions with landmarks,
 * and reads steps aloud (text-to-voice).
 */

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Volume2, VolumeX, CheckCircle, Navigation, MapPin } from "lucide-react";

import { useNetworkStatus, useMounted } from "@/hooks";
import { apiClient } from "@/lib/api";
import { findOfflineRoute, type RouteResult } from "@/lib/offlineRouter";
import { speakDirections, isSpeechSynthesisSupported } from "@/lib/speechEngine";

function DirectionsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { mode } = useNetworkStatus();
  const mounted = useMounted();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ttsInstanceRef = useRef<{ cancel: () => void } | null>(null);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Read coordinates and name from URL query params
  const destinationId = params.id as string;
  const destinationName = searchParams.get("name") || "Destination";
  
  const dlat = parseFloat(searchParams.get("dlat") || "0");
  const dlng = parseFloat(searchParams.get("dlng") || "0");
  const olatParam = searchParams.get("olat");
  const olngParam = searchParams.get("olng");

  useEffect(() => {
    async function calculateRoute() {
      setLoading(true);
      setError(null);

      let originLat = parseFloat(olatParam || "0");
      let originLng = parseFloat(olngParam || "0");

      // Auto-detect location if not provided
      if (!olatParam || !olngParam) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
            });
          });
          originLat = position.coords.latitude;
          originLng = position.coords.longitude;
        } catch (err) {
          // Default to Redemption City center if geolocation fails
          originLat = 6.8097;
          originLng = 3.4588;
        }
      }

      const origin = { lat: originLat, lng: originLng };
      const destination = { lat: dlat, lng: dlng };

      if (mode === "online") {
        try {
          const response = await apiClient.post<{ success: boolean; data: any }>(
            "/api/route/directions",
            { origin, destination, mode: "walking" }
          );
          if (response.success && response.data) {
            setRoute({
              routeId: response.data.routeId,
              mode: response.data.mode || "walking",
              distanceMeters: response.data.distanceMeters,
              durationSeconds: response.data.durationSeconds,
              waypoints: response.data.waypoints,
              steps: response.data.steps,
              isStraightLine: response.data.routeId === "straight-line",
            });
          } else {
            calculateOfflineFallback(origin, destination);
          }
        } catch (err) {
          calculateOfflineFallback(origin, destination);
        }
      } else {
        calculateOfflineFallback(origin, destination);
      }
      setLoading(false);
    }

    function calculateOfflineFallback(origin: any, destination: any) {
      const result = findOfflineRoute(origin, destination, undefined, destinationName);
      setRoute(result);
    }

    calculateRoute();

    return () => {
      if (ttsInstanceRef.current) {
        ttsInstanceRef.current.cancel();
      }
    };
  }, [destinationId, dlat, dlng, olatParam, olngParam, mode]);

  // Render MapLibre route LineString
  useEffect(() => {
    if (!mapContainerRef.current || !route || route.waypoints.length === 0) return;

    let map: maplibregl.Map | null = null;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [route.waypoints[0].lng, route.waypoints[0].lat],
        zoom: 15,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!map) return;
        // Add route GeoJSON source
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.waypoints.map((w) => [w.lng, w.lat]),
            },
          },
        });

        // Add blue route line layer
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3B82F6",
            "line-width": 6,
            "line-opacity": 0.85,
          },
        });

        // Add markers for origin and destination
        const originCoords = [route.waypoints[0].lng, route.waypoints[0].lat] as [number, number];
        const destCoords = [
          route.waypoints[route.waypoints.length - 1].lng,
          route.waypoints[route.waypoints.length - 1].lat,
        ] as [number, number];

        // Origin Marker (green dot)
        const startEl = document.createElement("div");
        startEl.className = "h-4 w-4 bg-emerald-500 border-2 border-white rounded-full shadow-md";
        new maplibregl.Marker({ element: startEl }).setLngLat(originCoords).addTo(map);

        // Destination Marker (red pin)
        const endEl = document.createElement("div");
        endEl.className = "text-rose-600 animate-bounce";
        endEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742c1.085-.77 2.874-2.205 3.86-4.582C18.57 14.88 19 12.879 19 10.5c0-4.693-3.693-8.5-8.5-8.5s-8.5 3.807-8.5 8.5c0 2.379.43 4.38 1.414 6.746 1.01 2.43 2.868 3.962 3.94 4.777a16.95 16.95 0 001.203.829zm1.71-12.851a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clip-rule="evenodd" /></svg>`;
        new maplibregl.Marker({ element: endEl }).setLngLat(destCoords).addTo(map);

        // Fit bounds to show the entire route
        const bounds = new maplibregl.LngLatBounds();
        route.waypoints.forEach((w) => bounds.extend([w.lng, w.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 16 });
      });
    } catch (err) {
      console.error("MapLibre GL failed to initialize:", err);
      setError("Unable to load map. Your device might not support WebGL.");
    }

    return () => {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.warn("Map remove failed:", e);
        }
      }
      mapRef.current = null;
    };
  }, [route]);

  const toggleSpeak = () => {
    if (isSpeaking) {
      if (ttsInstanceRef.current) {
        ttsInstanceRef.current.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!route || route.steps.length === 0) return;

    setIsSpeaking(true);
    const stepTexts = route.steps.map((s) => s.instruction);

    ttsInstanceRef.current = speakDirections(
      stepTexts,
      i18n.language,
      () => setIsSpeaking(false)
    );
  };

  const handleArrival = () => {
    if (ttsInstanceRef.current) {
      ttsInstanceRef.current.cancel();
    }
    router.push("/app");
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">{t("loading")}</p>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="p-3 bg-red-50 text-red-500 rounded-full mb-3">
          <ArrowLeft className="h-8 w-8" />
        </div>
        <p className="text-slate-800 font-bold mb-2">{t("error")}</p>
        <p className="text-sm text-slate-500 mb-6">{error || "Failed to load route."}</p>
        <button
          onClick={() => router.push("/app")}
          className="px-6 py-2 bg-[#ff6b00] text-white rounded-xl text-sm font-bold shadow-md"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    return `${mins} ${t("minutes")}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header and Summary Panel */}
      <div className="bg-white border-b border-slate-200 shadow-sm z-10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push("/app")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm text-slate-400 font-bold uppercase tracking-wider">{t("directions")}</h1>
            <h2 className="text-base font-extrabold text-slate-800 truncate max-w-xs">{destinationName}</h2>
          </div>
        </div>

        {/* Route Meta Summary Card */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/50 rounded-xl p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-orange-600 rounded-lg">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{t("distance")}</p>
              <p className="text-sm font-extrabold text-slate-800">{formatDistance(route.distanceMeters)}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{t("estimatedTime")}</p>
            <p className="text-sm font-extrabold text-slate-800">{formatDuration(route.durationSeconds)}</p>
          </div>

          {mounted && isSpeechSynthesisSupported() && (
            <button
              onClick={toggleSpeak}
              className={`p-2.5 rounded-full transition-all border ${
                isSpeaking
                  ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title={isSpeaking ? t("stopSpeaking") : t("speakDirections")}
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Map Split view (Half screen) */}
      <div className="flex-1 min-h-[250px] relative">
        <div ref={mapContainerRef} className="h-full w-full" />
        
        {route.isStraightLine && (
          <div className="absolute top-3 left-3 right-3 bg-amber-500/90 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md backdrop-blur-sm flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{t("straightLine")}</span>
          </div>
        )}
      </div>

      {/* Step by Step Directions Pane */}
      <div className="bg-white border-t border-slate-200 max-h-[35%] overflow-y-auto z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{t("speakDirections")}</h3>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{route.steps.length} {t("settings")}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {route.steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 p-4 items-start hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center shrink-0 mt-0.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-500">
                  {idx + 1}
                </span>
                {idx < route.steps.length - 1 && <div className="w-0.5 h-10 bg-slate-100 mt-2" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {step.instruction}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-bold">
                  {formatDistance(step.distance_meters)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button at bottom of scrolling card */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 sticky bottom-0">
          <button
            onClick={handleArrival}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{t("arrived")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DirectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading route details...</p>
      </div>
    }>
      <DirectionsContent />
    </Suspense>
  );
}
