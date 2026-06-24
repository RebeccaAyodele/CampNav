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
import { findOfflineRoute, haversineDistance, type RouteResult } from "@/lib/offlineRouter";
import { speakDirections, isSpeechSynthesisSupported } from "@/lib/speechEngine";
import { connectSocket, disconnectSocket, onEvent, offEvent } from "@/lib/socketClient";
import { config } from "@/config";
import { apiClient } from "@/lib/api";

interface ShuttleData {
  shuttleId: string;
  driverName?: string;
  lat: number;
  lng: number;
  zone?: string;
  passengerLoad: number;
  lastCheckin: string;
}

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

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [followUserMode, setFollowUserMode] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);

  const activeStepRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const walkSimIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [shuttles, setShuttles] = useState<ShuttleData[]>([]);
  const shuttleMarkersRef = useRef<Record<string, maplibregl.Marker>>({});

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

      const isSim = searchParams.get("sim") === "true";
      let originLat = parseFloat(olatParam || "0");
      let originLng = parseFloat(olngParam || "0");

      // Override start location to Main Gate if simulating for demo
      if (isSim) {
        originLat = 6.8199;
        originLng = 3.4564;
      } else if (!olatParam || !olngParam) {
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

      // Calculate distance to Redemption City center
      const distToCamp = haversineDistance([originLng, originLat], [3.4588, 6.8097]);

      if (distToCamp > 3000) {
        // --- HYBRID ROUTING ---
        // 1. External leg: Origin to Main Gate
        let externalRoute: RouteResult | null = null;
        if (mode === "online") {
          try {
            const response = await fetch("/api/directions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                origin,
                destination: { lat: 6.8199, lng: 3.4564 },
                mode: "driving"
              })
            });
            const resJson = await response.json();
            if (resJson.success && resJson.data) {
              externalRoute = resJson.data;
            }
          } catch (err) {
            console.warn("External API routing failed, falling back to straight-line:", err);
          }
        }

        // If online fetch failed or offline, generate straight-line to Main Gate
        if (!externalRoute) {
          const distance = Math.round(haversineDistance([originLng, originLat], [3.4564, 6.8199]));
          externalRoute = {
            routeId: "external-fallback",
            mode: "driving",
            distanceMeters: distance,
            durationSeconds: Math.round(distance / 13.89), // driving speed ~ 50 km/h
            waypoints: [
              { lat: originLat, lng: originLng },
              { lat: 6.8199, lng: 3.4564 }
            ],
            steps: [
              {
                instruction: `Drive towards Redemption City Main Gate for ${distance}m`,
                distance_meters: distance
              }
            ],
            isStraightLine: true
          };
        }

        // 2. Internal leg: Main Gate to destination
        const internalRoute = findOfflineRoute(
          { lat: 6.8199, lng: 3.4564 },
          destination,
          "Main Gate",
          destinationName
        );

        // 3. Merge routes
        const mergedWaypoints = [...externalRoute.waypoints, ...internalRoute.waypoints];
        const mergedSteps = [
          ...externalRoute.steps,
          {
            instruction: "Enter Redemption City Main Gate",
            distance_meters: 0
          },
          ...internalRoute.steps
        ];

        setRoute({
          routeId: `hybrid-${Date.now()}`,
          mode: "hybrid",
          distanceMeters: externalRoute.distanceMeters + internalRoute.distanceMeters,
          durationSeconds: externalRoute.durationSeconds + internalRoute.durationSeconds,
          waypoints: mergedWaypoints,
          steps: mergedSteps,
          isStraightLine: externalRoute.isStraightLine || internalRoute.isStraightLine
        });
      } else {
        // --- LOCAL ROUTING ---
        if (mode === "online") {
          try {
            const response = await fetch("/api/directions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                origin,
                destination,
                mode: "walking"
              })
            });
            const resJson = await response.json();
            if (resJson.success && resJson.data) {
              setRoute({
                routeId: resJson.data.routeId,
                mode: resJson.data.mode || "walking",
                distanceMeters: resJson.data.distanceMeters,
                durationSeconds: resJson.data.durationSeconds,
                waypoints: resJson.data.waypoints,
                steps: resJson.data.steps,
                isStraightLine: resJson.data.routeId === "straight-line",
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
      }
      setLoading(false);
    }

    function calculateOfflineFallback(origin: any, destination: any) {
      const result = findOfflineRoute(origin, destination, undefined, destinationName);
      setRoute(result);
    }

    calculateRoute();

    return () => {
      if (walkSimIntervalRef.current) {
        clearInterval(walkSimIntervalRef.current);
      }
      if (ttsInstanceRef.current) {
        ttsInstanceRef.current.cancel();
      }
    };
  }, [destinationId, dlat, dlng, olatParam, olngParam, mode, searchParams]);

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
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (_) {}
        userMarkerRef.current = null;
      }
      // Remove all shuttle markers
      Object.values(shuttleMarkersRef.current).forEach((m) => m.remove());
      shuttleMarkersRef.current = {};

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

  // Auto-scroll to active step card
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStepIndex]);

  // Geolocation watchPosition GPS tracking effect
  useEffect(() => {
    if (!mounted || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCoords: [number, number] = [lng, lat];
        
        setUserLocation(newCoords);

        if (route && route.waypoints.length > 0) {
          let closestIdx = 0;
          let minDistance = Infinity;

          route.waypoints.forEach((wp, idx) => {
            const dist = haversineDistance([lng, lat], [wp.lng, wp.lat]);
            if (dist < minDistance) {
              minDistance = dist;
              closestIdx = idx;
            }
          });

          const activeStep = Math.min(closestIdx, route.steps.length - 1);
          
          // Auto-advance step if user moves along the path
          setCurrentStepIndex((prev) => {
            if (prev !== activeStep) {
              if (isSpeaking) {
                // Stop current speech and speak the new instruction
                if (ttsInstanceRef.current) {
                  ttsInstanceRef.current.cancel();
                }
                const instruction = route.steps[activeStep].instruction;
                ttsInstanceRef.current = speakDirections([instruction], i18n.language, () => {});
              }
              return activeStep;
            }
            return prev;
          });

          // Check if arrived (within 8 meters of destination / final waypoint)
          const lastWp = route.waypoints[route.waypoints.length - 1];
          const distToDest = haversineDistance([lng, lat], [lastWp.lng, lastWp.lat]);
          if (distToDest < 8 && !hasArrived) {
            setHasArrived(true);
            if (ttsInstanceRef.current) {
              ttsInstanceRef.current.cancel();
            }
            if (isSpeaking) {
              speakDirections(["You have arrived at your destination."], i18n.language, () => {});
            }
          }
        }
      },
      (err) => {
        console.error("GPS Tracking failed:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mounted, route, hasArrived, isSpeaking, i18n.language]);

  // Synchronize user pulsing marker on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center h-6 w-6";
      el.innerHTML = `
        <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(map);
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLngLat(userLocation);
    }

    if (followUserMode) {
      map.easeTo({
        center: userLocation,
        zoom: 16,
        duration: 1000
      });
    }
  }, [userLocation, followUserMode]);

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

  const stopWalkSimulation = () => {
    if (walkSimIntervalRef.current) {
      clearInterval(walkSimIntervalRef.current);
      walkSimIntervalRef.current = null;
    }
    setIsSimulatingWalk(false);
  };

  const startWalkSimulation = (r: RouteResult) => {
    if (!r || r.waypoints.length === 0) return;

    setIsSimulatingWalk(true);
    setIsSpeaking(true);
    setHasArrived(false);
    setCurrentStepIndex(0);

    let currentIndex = 0;
    const firstWp = r.waypoints[0]!;
    setUserLocation([firstWp.lng, firstWp.lat]);

    walkSimIntervalRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex >= r.waypoints.length) {
        if (walkSimIntervalRef.current) {
          clearInterval(walkSimIntervalRef.current);
          walkSimIntervalRef.current = null;
        }
        setIsSimulatingWalk(false);
        setHasArrived(true);
        speakDirections(["You have arrived at your destination."], i18n.language, () => {});
        return;
      }

      const wp = r.waypoints[currentIndex]!;
      const lng = wp.lng;
      const lat = wp.lat;
      setUserLocation([lng, lat]);

      let closestIdx = 0;
      let minDistance = Infinity;

      r.waypoints.forEach((wpVal, idx) => {
        const dist = haversineDistance([lng, lat], [wpVal.lng, wpVal.lat]);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      const activeStep = Math.min(closestIdx, r.steps.length - 1);
      
      setCurrentStepIndex((prev) => {
        if (prev !== activeStep) {
          if (ttsInstanceRef.current) {
            ttsInstanceRef.current.cancel();
          }
          const instruction = r.steps[activeStep].instruction;
          ttsInstanceRef.current = speakDirections([instruction], i18n.language, () => {});
          return activeStep;
        }
        return prev;
      });
    }, 3500);
  };

  const toggleWalkSimulation = () => {
    const isSim = searchParams.get("sim") === "true";
    if (!isSim) {
      // Redirect to Main Gate coordinates with sim=true
      router.push(`/app/directions/${destinationId}?name=${encodeURIComponent(destinationName)}&dlat=${dlat}&dlng=${dlng}&olat=6.8199&olng=3.4564&sim=true`);
      return;
    }

    if (isSimulatingWalk) {
      stopWalkSimulation();
    } else if (route) {
      startWalkSimulation(route);
    }
  };

  // Auto-play walk simulation if sim=true query param is present
  useEffect(() => {
    const isSim = searchParams.get("sim") === "true";
    if (isSim && route && !isSimulatingWalk && !hasArrived) {
      startWalkSimulation(route);
    }
  }, [route, searchParams]);

  // WebSocket shuttle location updates and API sync
  useEffect(() => {
    if (!mounted) return;

    // Connect to Socket.IO
    connectSocket();

    // Fetch initial active shuttles
    apiClient.get<{ success: boolean; data: { shuttles: ShuttleData[] } }>("/api/shuttles/active")
      .then((res) => {
        if (res.success && res.data?.shuttles) {
          setShuttles(res.data.shuttles);
        }
      })
      .catch((err) => console.warn("Visitor failed to load initial shuttles:", err));

    // WebSocket event listener
    const handleShuttleMoved = (data: ShuttleData) => {
      setShuttles((prev) => {
        const idx = prev.findIndex((s) => s.shuttleId === data.shuttleId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [data, ...prev];
      });
    };

    onEvent<ShuttleData>("shuttle_moved", handleShuttleMoved);

    return () => {
      offEvent("shuttle_moved", handleShuttleMoved);
      disconnectSocket();
    };
  }, [mounted]);

  // Synchronize shuttle markers on visitor map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove any markers not in active list
    const activeIds = new Set(shuttles.map(s => s.shuttleId));
    Object.keys(shuttleMarkersRef.current).forEach((key) => {
      if (!activeIds.has(key)) {
        shuttleMarkersRef.current[key].remove();
        delete shuttleMarkersRef.current[key];
      }
    });

    shuttles.forEach((shuttle) => {
      const { shuttleId, lat, lng, driverName, passengerLoad } = shuttle;
      if (!lat || !lng) return;

      const markerKey = shuttleId;
      const existing = shuttleMarkersRef.current[markerKey];

      if (existing) {
        existing.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.className = "flex items-center justify-center h-7 w-7 bg-orange-500 text-white rounded-full border border-white shadow-lg text-xs cursor-pointer hover:bg-orange-600 transition-colors z-20";
        el.innerText = "🚌";

        const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div class="text-slate-800 p-1 text-[10px] leading-tight">
            <h4 class="font-bold text-xs text-orange-600">${shuttleId}</h4>
            <p class="mt-0.5"><strong>Driver:</strong> ${driverName || "N/A"}</p>
            <p><strong>Load:</strong> ${passengerLoad} pax</p>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        shuttleMarkersRef.current[markerKey] = marker;
      }
    });
  }, [shuttles]);

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

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={toggleWalkSimulation}
                className={`px-3 py-2 rounded-xl text-xs font-black tracking-wider transition-all border ${
                  isSimulatingWalk
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 animate-pulse"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isSimulatingWalk ? "SIM ACTIVE" : "SIM WALK"}
              </button>
            )}

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

        {/* Recenter Button */}
        {userLocation && (
          <button
            onClick={() => setFollowUserMode((prev) => !prev)}
            className={`absolute bottom-4 right-4 p-3 rounded-full shadow-xl border backdrop-blur-md transition-all z-10 ${
              followUserMode
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle Recenter GPS"
          >
            <Navigation className={`h-5 w-5 ${followUserMode ? "fill-white" : ""}`} />
          </button>
        )}
      </div>

      {/* Step by Step Directions Pane */}
      <div className="bg-white border-t border-slate-200 max-h-[35%] overflow-y-auto z-10">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{t("speakDirections")}</h3>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{route.steps.length} {t("settings")}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {route.steps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeStepRef : null}
                className={`flex gap-4 p-4 items-start transition-all duration-300 ${
                  isActive ? "bg-orange-50/70 border-l-4 border-orange-500 shadow-sm" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col items-center shrink-0 mt-0.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                    isActive ? "bg-orange-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"
                  }`}>
                    {idx + 1}
                  </span>
                  {idx < route.steps.length - 1 && <div className="w-0.5 h-10 bg-slate-100 mt-2" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                    isActive ? "text-orange-950 font-bold" : "text-slate-700 font-semibold"
                  }`}>
                    {step.instruction}
                  </p>
                  <p className={`text-xs mt-1 font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? "text-orange-500" : "text-slate-400"
                  }`}>
                    {formatDistance(step.distance_meters)} {isActive && "• CURRENT STEP"}
                  </p>
                </div>
              </div>
            );
          })}
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
