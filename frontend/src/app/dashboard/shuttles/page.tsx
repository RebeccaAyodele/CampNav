/**
 * Shuttle Management Page (/dashboard/shuttles)
 * Lists all active shuttles with real-time WebSocket updates,
 * and features a multi-stop Supply Route Optimizer panel.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bus, User, MapPin, Users, Navigation, Compass, Calendar, Plus, Trash2, CheckCircle2, ListOrdered } from "lucide-react";

import { apiClient } from "@/lib/api";
import { onEvent, offEvent } from "@/lib/socketClient";

interface Shuttle {
  shuttleId: string;
  driverName?: string;
  lat: number;
  lng: number;
  zone?: string;
  passengerLoad: number;
  lastCheckin: string;
}

interface CoordinateInput {
  lat: string;
  lng: string;
}

interface OptimizedLeg {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  distanceMeters: number;
  durationSeconds: number;
  steps: { instruction: string; distance_meters: number }[];
}

interface SupplyOptimizationResult {
  routeId: string;
  orderedStops: { lat: number; lng: number }[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs: OptimizedLeg[];
}

export default function ShuttlesPage() {
  const { t } = useTranslation();

  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [loading, setLoading] = useState(true);

  // Optimizer form states
  const [origin, setOrigin] = useState<CoordinateInput>({ lat: "6.8199", lng: "3.4564" });
  const [stops, setStops] = useState<CoordinateInput[]>([
    { lat: "6.8100", lng: "3.4560" },
    { lat: "6.8160", lng: "3.4530" },
  ]);
  const [optimizerResult, setOptimizerResult] = useState<SupplyOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);

  // Fetch initial shuttles list
  useEffect(() => {
    async function fetchShuttles() {
      try {
        setLoading(true);
        const response = await apiClient.get<{ success: boolean; data: { shuttles: Shuttle[] } }>("/api/shuttles/active");
        if (response.success && response.data?.shuttles) {
          setShuttles(response.data.shuttles);
        }
      } catch (err) {
        console.error("Failed to load shuttles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchShuttles();
  }, []);

  // Listen for socket events
  useEffect(() => {
    const handleShuttleMoved = (data: Shuttle) => {
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

    onEvent<Shuttle>("shuttle_moved", handleShuttleMoved);
    return () => {
      offEvent("shuttle_moved", handleShuttleMoved);
    };
  }, []);

  // Filtered shuttles list
  const filteredShuttles = shuttles.filter((shuttle) => {
    const matchesSearch =
      shuttle.shuttleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shuttle.driverName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone =
      filterZone === "all" ||
      (shuttle.zone || "").toLowerCase() === filterZone.toLowerCase();

    return matchesSearch && matchesZone;
  });

  // Unique zones for filter dropdown
  const availableZones = Array.from(
    new Set(shuttles.map((s) => s.zone).filter(Boolean))
  ) as string[];

  // Optimizer Add/Remove stops
  const addStop = () => {
    setStops((prev) => [...prev, { lat: "", lng: "" }]);
  };

  const removeStop = (idx: number) => {
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStopChange = (idx: number, field: "lat" | "lng", val: string) => {
    setStops((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOptimizing(true);
    setOptimizerError(null);
    setOptimizerResult(null);

    const originLat = parseFloat(origin.lat);
    const originLng = parseFloat(origin.lng);

    if (isNaN(originLat) || isNaN(originLng)) {
      setOptimizerError("Origin coordinates must be valid numbers");
      setIsOptimizing(false);
      return;
    }

    const formattedStops = stops
      .map((s) => ({
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
      }))
      .filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

    if (formattedStops.length === 0) {
      setOptimizerError("At least one valid stop coordinate is required");
      setIsOptimizing(false);
      return;
    }

    try {
      const response = await apiClient.post<{ success: boolean; data: SupplyOptimizationResult }>(
        "/api/route/supply",
        {
          origin: { lat: originLat, lng: originLng },
          stops: formattedStops,
        }
      );

      if (response.success && response.data) {
        setOptimizerResult(response.data);
      } else {
        setOptimizerError("Failed to calculate optimization. Please check inputs.");
      }
    } catch (err: any) {
      setOptimizerError(err.message || "Optimization request failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white">{t("shuttleManagement")}</h1>
        <p className="text-sm text-slate-400 font-medium mt-0.5">
          {t("shuttleManagementSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Shuttles Table (Left 2 cols) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-[#0D1B4B]/35 border border-white/5 p-4 rounded-2xl shadow-lg">
            <input
              type="text"
              placeholder="Search shuttle ID or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-blue-500 font-medium"
            />
            
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold uppercase tracking-wider"
            >
              <option value="all">All Zones</option>
              {availableZones.map((zone) => (
                <option key={zone} value={zone}>
                  Zone {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-[#0D1B4B]/20 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredShuttles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#071133] border-b border-white/5 text-slate-400 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{t("vehicle")}</th>
                      <th className="px-6 py-4">{t("driver")}</th>
                      <th className="px-6 py-4">Position</th>
                      <th className="px-6 py-4">{t("zone")}</th>
                      <th className="px-6 py-4">{t("passengers")}</th>
                      <th className="px-6 py-4">{t("lastCheckin")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredShuttles.map((shuttle) => (
                      <tr key={shuttle.shuttleId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <Bus className="h-4.5 w-4.5 text-blue-400" />
                          <span>{shuttle.shuttleId}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-semibold">
                          {shuttle.driverName || "—"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {shuttle.lat.toFixed(5)}, {shuttle.lng.toFixed(5)}
                        </td>
                        <td className="px-6 py-4">
                          {shuttle.zone ? (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-full text-xs font-black uppercase">
                              Zone {shuttle.zone}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-semibold">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-emerald-400">
                            {shuttle.passengerLoad} pax
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-semibold text-xs">
                          {new Date(shuttle.lastCheckin).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 font-semibold">
                No active shuttles found
              </div>
            )}
          </div>
        </div>

        {/* Supply Route Optimizer (Right 1 col) */}
        <div className="bg-[#0D1B4B]/35 border border-white/5 rounded-3xl p-5 shadow-2xl space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Compass className="h-5.5 w-5.5 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
            <h2 className="font-extrabold text-sm text-slate-300 tracking-wide uppercase">
              {t("supplyRouteOptimizer")}
            </h2>
          </div>

          {optimizerError && (
            <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
              {optimizerError}
            </div>
          )}

          <form onSubmit={handleOptimize} className="space-y-4">
            {/* Origin coordinates */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Origin [lat, lng]
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Lat"
                  value={origin.lat}
                  onChange={(e) => setOrigin({ ...origin, lat: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 font-semibold"
                  required
                />
                <input
                  type="text"
                  placeholder="Lng"
                  value={origin.lng}
                  onChange={(e) => setOrigin({ ...origin, lng: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 font-semibold"
                  required
                />
              </div>
            </div>

            {/* Stops list coordinates */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                <span>Stops Coordinates</span>
                <button
                  type="button"
                  onClick={addStop}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold lowercase tracking-normal text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> add
                </button>
              </label>

              {stops.map((stop, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-white/30 w-4">#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="Lat"
                    value={stop.lat}
                    onChange={(e) => handleStopChange(idx, "lat", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 font-semibold flex-1"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Lng"
                    value={stop.lng}
                    onChange={(e) => handleStopChange(idx, "lng", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 font-semibold flex-1"
                    required
                  />
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStop(idx)}
                      className="p-2 hover:bg-white/5 text-rose-400 hover:text-rose-300 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isOptimizing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all"
            >
              {isOptimizing ? "Optimizing..." : t("optimizeRoute")}
            </button>
          </form>

          {/* Optimizer Results */}
          {optimizerResult && (
            <div className="border-t border-white/5 pt-4 space-y-4 animate-in fade-in duration-300">
              <div className="bg-[#071133] border border-white/5 rounded-xl p-3.5 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">{t("totalDistance")}</p>
                  <p className="font-extrabold text-white text-sm mt-0.5">
                    {(optimizerResult.totalDistanceMeters / 1000).toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">{t("totalDuration")}</p>
                  <p className="font-extrabold text-white text-sm mt-0.5">
                    {Math.round(optimizerResult.totalDurationSeconds / 60)} mins
                  </p>
                </div>
              </div>

              {/* Steps timeline list */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ListOrdered className="h-4 w-4" />
                  <span>Leg-by-Leg Details</span>
                </p>

                <div className="space-y-3.5 pl-1.5">
                  {optimizerResult.legs.map((leg, idx) => (
                    <div key={idx} className="relative flex gap-3.5 items-start text-xs border-l border-white/10 pl-4 last:border-0 pb-1">
                      <div className="absolute -left-1.5 top-0.5 h-3 w-3 bg-indigo-500 rounded-full border-2 border-slate-900" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200">Leg #{idx + 1}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          To stop: {leg.to.lat.toFixed(4)}, {leg.to.lng.toFixed(4)}
                        </p>
                        {leg.steps.map((step, sidx) => (
                          <p key={sidx} className="text-slate-350 font-medium mt-1 leading-relaxed italic">
                            — {step.instruction} ({step.distance_meters}m)
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
