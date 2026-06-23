/**
 * Dashboard Overview (/dashboard/page.tsx)
 * Renders real-time control room metrics, live MapLibre map showing active shuttles (blue bus icons)
 * and lost person reports (red alert pins), real-time WebSocket listeners, and activity feed.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";
import { Bus, Users, ClipboardList, Radio, MapPin, Navigation, ArrowRight, AlertTriangle } from "lucide-react";

import { apiClient } from "@/lib/api";
import { onEvent, offEvent } from "@/lib/socketClient";
import { getPOIs } from "@/data/campGeoJSON";
import { config } from "@/config";

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

const DEFAULT_CENTER: [number, number] = [3.4588, 6.8097];

interface ShuttleData {
  shuttleId: string;
  driverName?: string;
  lat: number;
  lng: number;
  zone?: string;
  passengerLoad: number;
  lastCheckin: string;
}

interface LostPersonReport {
  id: string;
  name?: string;
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  lastSeenLocation?: string;
  lat?: number;
  lng?: number;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

interface ActivityLog {
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const shuttleMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const lostPersonMarkersRef = useRef<Record<string, maplibregl.Marker>>({});

  const [shuttles, setShuttles] = useState<ShuttleData[]>([]);
  const [isSimulatingShuttles, setIsSimulatingShuttles] = useState(false);
  const [shuttleIndices, setShuttleIndices] = useState<Record<string, number>>({
    "shuttle-1": 0,
    "shuttle-2": 0,
    "shuttle-3": 0,
    "shuttle-4": 0,
  });
  const shuttleSimIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Shuttle GPS telemetry simulation effect
  useEffect(() => {
    if (!isSimulatingShuttles) {
      if (shuttleSimIntervalRef.current) {
        clearInterval(shuttleSimIntervalRef.current);
        shuttleSimIntervalRef.current = null;
      }
      return;
    }

    const simDrivers = [
      { id: "shuttle-1", name: "Ade", route: [[3.4564458, 6.8198983], [3.4564295, 6.8199064], [3.4571496, 6.8185982], [3.4571332, 6.8185576], [3.4571332, 6.8185901], [3.4574025, 6.8176721], [3.4573915, 6.8168145]], zone: "Zone A" },
      { id: "shuttle-2", name: "Olumide", route: [[3.456378, 6.8199736], [3.4573852, 6.8176968], [3.4574709, 6.8170158], [3.4568388, 6.8148986], [3.4579853, 6.8144624], [3.4577508, 6.8125066], [3.4573048, 6.8112875], [3.4567644, 6.810407]], zone: "Zone B" },
      { id: "shuttle-3", name: "Chioma", route: [[3.4612929, 6.8103232], [3.4611512, 6.8098925], [3.4619833, 6.809374], [3.4616646, 6.8084687], [3.4612929, 6.8077831]], zone: "Zone C" },
      { id: "shuttle-4", name: "Musa", route: [[3.4593595, 6.7628041], [3.4589156, 6.762744], [3.4589694, 6.7618959], [3.4687606, 6.7622632], [3.4688233, 6.7620483], [3.4691223, 6.76218], [3.469788, 6.7607643]], zone: "Zone D" }
    ];

    shuttleSimIntervalRef.current = setInterval(() => {
      simDrivers.forEach((drv) => {
        setShuttleIndices((prev) => {
          const currentIndex = prev[drv.id] ?? 0;
          const nextIndex = (currentIndex + 1) % drv.route.length;
          const [lng, lat] = drv.route[nextIndex]!;

          // Fire real HTTP check-in posts to backend (which broadcasts via WebSocket)
          fetch(`${config.api.baseUrl}/api/shuttles/checkin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shuttleId: drv.id,
              driverName: drv.name,
              lat,
              lng,
              zone: drv.zone,
              passengerLoad: Math.floor(Math.random() * 15) + 3,
            }),
          }).catch((err) => console.error("Telemetry Sim check-in failed:", err));

          return {
            ...prev,
            [drv.id]: nextIndex,
          };
        });
      });
    }, 4000);

    return () => {
      if (shuttleSimIntervalRef.current) {
        clearInterval(shuttleSimIntervalRef.current);
      }
    };
  }, [isSimulatingShuttles]);

  const [lostPersons, setLostPersons] = useState<LostPersonReport[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  const [stats, setStats] = useState({
    activeShuttles: 0,
    openLostPersons: 0,
    totalCheckins: 0,
  });

  const [loading, setLoading] = useState(true);

  // Fetch initial summary metrics
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Parallel requests with auth headers (handled by apiClient)
        const [shuttlesRes, lostPersonsRes, logsRes] = await Promise.all([
          apiClient.get<{ success: boolean; data: { shuttles: ShuttleData[] } }>("/api/shuttles/active"),
          apiClient.get<{ success: boolean; data: { reports: LostPersonReport[] } }>("/api/lost-persons?status=open&limit=50"),
          apiClient.get<{ success: boolean; data: { logs: ActivityLog[] } }>("/api/logs?limit=20"),
        ]);

        const shuttlesList = shuttlesRes.data?.shuttles || [];
        const lostPersonsList = lostPersonsRes.data?.reports || [];
        const logsList = logsRes.data?.logs || [];

        setShuttles(shuttlesList);
        setLostPersons(lostPersonsList);
        setLogs(logsList);

        // Calculate counts
        setStats({
          activeShuttles: shuttlesList.length,
          openLostPersons: lostPersonsList.filter(p => p.status === "open").length,
          totalCheckins: logsList.filter(l => l.type === "shuttle_checkin").length,
        });
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
          },
        ],
      },
      center: DEFAULT_CENTER,
      zoom: 13.5,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
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
            4,
            16,
            8,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.4)",
          "circle-opacity": 0.85,
        },
      });

      // Click popup on POIs
      map.on("click", "poi-circles", (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const props = feature.properties as any;
          const coords = (feature.geometry as any).coordinates;
          new maplibregl.Popup({ offset: 10 })
            .setLngLat(coords)
            .setHTML(`
              <div class="text-slate-800 p-1 text-xs">
                <h4 class="font-bold text-sm">${props.name}</h4>
                <p class="mt-1 capitalize text-slate-500"><strong>Category:</strong> ${props.category || "other"}</p>
                <p>${props.zone ? `<strong>Zone:</strong> ${props.zone}` : ""}</p>
              </div>
            `)
            .addTo(map);
        }
      });

      // Hover cursor changes
      map.on("mouseenter", "poi-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "poi-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      // Clean up markers
      Object.values(shuttleMarkersRef.current).forEach(m => m.remove());
      Object.values(lostPersonMarkersRef.current).forEach(m => m.remove());
      shuttleMarkersRef.current = {};
      lostPersonMarkersRef.current = {};

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Synchronize shuttle markers on map
  useEffect(() => {
    if (!mapRef.current || shuttles.length === 0) return;

    shuttles.forEach((shuttle) => {
      const { shuttleId, lat, lng, driverName, passengerLoad, zone } = shuttle;
      if (!lat || !lng) return;

      const markerKey = shuttleId;
      const existing = shuttleMarkersRef.current[markerKey];

      if (existing) {
        existing.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.className = "flex items-center justify-center h-8 w-8 bg-orange-600 text-white rounded-full border-2 border-white shadow-lg text-sm cursor-pointer hover:bg-blue-700 transition-colors";
        el.innerText = "🚌";

        const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div class="text-slate-800 p-1 text-xs">
            <h4 class="font-bold text-sm">${shuttleId}</h4>
            <p class="mt-1"><strong>Driver:</strong> ${driverName || "N/A"}</p>
            <p><strong>Zone:</strong> ${zone || "N/A"}</p>
            <p><strong>Load:</strong> ${passengerLoad} passengers</p>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        shuttleMarkersRef.current[markerKey] = marker;
      }
    });
  }, [shuttles]);

  // Synchronize lost person markers on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Filter list for markers with lat/lng
    const activeLps = lostPersons.filter(lp => lp.lat && lp.lng && lp.status !== "resolved");

    // Remove any markers not in active list
    const activeIds = new Set(activeLps.map(lp => lp.id));
    Object.keys(lostPersonMarkersRef.current).forEach((key) => {
      if (!activeIds.has(key)) {
        lostPersonMarkersRef.current[key].remove();
        delete lostPersonMarkersRef.current[key];
      }
    });

    activeLps.forEach((lp) => {
      const { id, lat, lng, description, name, lastSeenLocation } = lp;
      if (!lat || !lng) return;

      const existing = lostPersonMarkersRef.current[id];

      if (existing) {
        existing.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.className = "flex items-center justify-center h-8 w-8 bg-rose-600 text-white rounded-full border-2 border-white shadow-lg text-sm cursor-pointer animate-bounce hover:bg-rose-700 transition-colors";
        el.innerText = "🚨";

        const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
          <div class="text-slate-800 p-1 text-xs max-w-[200px]">
            <h4 class="font-bold text-sm text-rose-600">Lost Person: ${name || "Unknown"}</h4>
            <p class="mt-1 font-semibold">${description}</p>
            <p class="mt-1"><strong>Last Seen:</strong> ${lastSeenLocation || "N/A"}</p>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        lostPersonMarkersRef.current[id] = marker;
      }
    });
  }, [lostPersons]);

  // WebSocket Live Listeners
  useEffect(() => {
    // Listen for shuttle checkin checks
    const handleShuttleMoved = (data: ShuttleData) => {
      // Update shuttles list
      setShuttles((prev) => {
        const idx = prev.findIndex((s) => s.shuttleId === data.shuttleId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data;
          return next;
        }
        return [data, ...prev];
      });

      // Append live log
      const newLog: ActivityLog = {
        type: "shuttle_checkin",
        description: `${data.shuttleId} checked in at zone ${data.zone || "N/A"} (${data.passengerLoad} pax)`,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        ...prev,
        totalCheckins: prev.totalCheckins + 1,
      }));
    };

    // Listen for new lost person alerts
    const handleNewLostPerson = (data: LostPersonReport) => {
      window.alert(`[CRITICAL] New Lost Person Report: ${data.description}`);

      setLostPersons((prev) => [data, ...prev]);

      const newLog: ActivityLog = {
        type: "lost_person_report",
        description: `New lost person alert: ${data.name || "Unknown"} - ${data.description}`,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      setStats((prev) => ({
        ...prev,
        openLostPersons: prev.openLostPersons + 1,
      }));
    };

    onEvent<ShuttleData>("shuttle_moved", handleShuttleMoved);
    onEvent<LostPersonReport>("new_lost_person", handleNewLostPerson);

    return () => {
      offEvent("shuttle_moved", handleShuttleMoved);
      offEvent("new_lost_person", handleNewLostPerson);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      {/* Page Title */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t("dashboard")}</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            {t("dashboardSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-3.5 py-1.5 rounded-full">
          <Radio className="h-4 w-4 animate-pulse text-orange-400" />
          <span>LIVE TRACKING</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="shrink-0 grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Active Shuttles Card */}
        <div className="bg-[#0d1e4c]/40 border border-white/10 hover:border-orange-500/20 transition-all duration-300 rounded-2xl p-5 shadow-lg flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("activeShuttles")}</p>
            <p className="text-3xl font-black text-white">{stats.activeShuttles}</p>
          </div>
          <div className="p-3.5 bg-orange-500/10 rounded-xl text-orange-400 group-hover:bg-orange-500/20 transition-colors">
            <Bus className="h-6 w-6" />
          </div>
        </div>

        {/* Open Cases Card */}
        <div className="bg-[#0d1e4c]/40 border border-white/10 hover:border-orange-500/20 transition-all duration-300 rounded-2xl p-5 shadow-lg flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("lostPersonCases")}</p>
            <p className="text-3xl font-black text-rose-400">{stats.openLostPersons}</p>
          </div>
          <div className="p-3.5 bg-rose-500/10 rounded-xl text-rose-400 group-hover:bg-rose-500/20 transition-colors">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Check-ins Card */}
        <div className="bg-[#0d1e4c]/40 border border-white/10 hover:border-orange-500/20 transition-all duration-300 rounded-2xl p-5 shadow-lg flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("totalCheckins")}</p>
            <p className="text-3xl font-black text-emerald-400">{stats.totalCheckins}</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Control Map */}
        <div className="lg:col-span-2 bg-[#0d1e4c]/20 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative min-h-[350px]">
          <div className="absolute top-4 left-4 z-10 bg-[#071133]/90 backdrop-blur border border-white/10 rounded-xl px-4 py-2 text-xs font-bold">
            Live Field Operations Map
          </div>
          <div ref={mapContainerRef} className="h-full w-full relative overflow-hidden rounded-3xl" />
        </div>

        {/* Right column: Simulator Controls + Live Activity Feed */}
        <div className="flex flex-col gap-6 lg:col-span-1 min-h-0">
          {/* Simulation Controller Panel */}
          <div className="bg-[#0d1e4c]/40 border border-orange-500/20 rounded-3xl p-5 shadow-2xl flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-200 tracking-wide uppercase">
                  ⚡ Telemetry Simulator
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Simulate live GPS check-ins from multiple routes
                </p>
              </div>
              <button
                onClick={() => setIsSimulatingShuttles((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSimulatingShuttles
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 animate-pulse"
                    : "bg-white/10 text-slate-300 border border-white/5 hover:bg-white/20"
                }`}
              >
                {isSimulatingShuttles ? "SIM ACTIVE" : "START SIM"}
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              {[
                { name: "Shuttle 1 (Ade)", route: "Main Gate ➔ Access Bank" },
                { name: "Shuttle 2 (Olumide)", route: "Main Gate ➔ Glory Arena" },
                { name: "Shuttle 3 (Chioma)", route: "Bible College ➔ Market" },
                { name: "Shuttle 4 (Musa)", route: "New Auditorium ➔ Simawa" }
              ].map((sh, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isSimulatingShuttles ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
                    <span className="font-bold text-slate-200">{sh.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[130px]">
                    {sh.route}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Log Activity Feed */}
          <div className="bg-[#0d1e4c]/20 border border-white/10 rounded-3xl p-5 shadow-2xl flex-1 flex flex-col min-h-[300px]">
            <h3 className="font-extrabold text-sm text-slate-300 mb-4 tracking-wide uppercase shrink-0 flex items-center gap-2">
              <Radio className="h-4.5 w-4.5 text-orange-400 animate-pulse" />
              <span>{t("activityLog")}</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {logs.length > 0 ? (
                logs.map((log, idx) => {
                  const isCheckin = log.type === "shuttle_checkin";
                  return (
                    <div key={idx} className="flex gap-3 text-xs items-start p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                      <span className={`text-base shrink-0 ${isCheckin ? "text-orange-400" : "text-rose-400"}`}>
                        {isCheckin ? "🚌" : "👤"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 leading-relaxed break-words">{log.description}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 font-semibold">
                  No activity reported yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation links */}
      <div className="shrink-0 grid gap-4 grid-cols-1 sm:grid-cols-2">
        <button
          onClick={() => router.push("/dashboard/shuttles")}
          className="flex items-center justify-center gap-2 py-4 bg-orange-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/10 active:scale-[0.99] transition-all"
        >
          <Bus className="h-5 w-5" />
          <span>{t("viewShuttles")}</span>
          <ArrowRight className="h-4.5 w-4.5 ml-1" />
        </button>

        <button
          onClick={() => router.push("/dashboard/lost-persons")}
          className="flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/10 active:scale-[0.99] transition-all"
        >
          <Users className="h-5 w-5" />
          <span>{t("viewLostPersons")}</span>
          <ArrowRight className="h-4.5 w-4.5 ml-1" />
        </button>
      </div>
    </div>
  );
}
