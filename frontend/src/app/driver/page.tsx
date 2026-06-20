/**
 * Driver Check-in Page (/driver/page.tsx)
 * High-contrast outdoor-optimized check-in dashboard for shuttle drivers.
 * Supports auto geolocation, memory of previous inputs, online submit, and offline queue.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation, User, Bus, Users, Map, CheckCircle2, RefreshCw } from "lucide-react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { apiClient } from "@/lib/api";
import { enqueue } from "@/lib/offlineQueue";

interface CheckinFormData {
  shuttleId: string;
  driverName: string;
  zone: string;
  passengerLoad: number;
}

export default function DriverPage() {
  const { t } = useTranslation();
  const { mode } = useNetworkStatus();

  const [formData, setFormData] = useState<CheckinFormData>({
    shuttleId: "",
    driverName: "",
    zone: "",
    passengerLoad: 0,
  });

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "queued" | "error">("idle");
  const [lastCheckinTime, setLastCheckinTime] = useState<string | null>(null);

  // Load remembered fields from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedShuttleId = localStorage.getItem("driver_shuttleId") || "";
      const savedDriverName = localStorage.getItem("driver_name") || "";
      const savedZone = localStorage.getItem("driver_zone") || "";
      setFormData((prev) => ({
        ...prev,
        shuttleId: savedShuttleId,
        driverName: savedDriverName,
        zone: savedZone,
      }));

      const savedLastTime = localStorage.getItem("driver_lastCheckinTime");
      if (savedLastTime) setLastCheckinTime(savedLastTime);
    }
    // Auto start location tracking
    trackLocation();
  }, []);

  const trackLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error("Location tracking error", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "passengerLoad" ? Math.max(0, parseInt(value) || 0) : value,
    }));
  };

  const incrementLoad = (val: number) => {
    setFormData((prev) => ({
      ...prev,
      passengerLoad: Math.max(0, prev.passengerLoad + val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shuttleId.trim()) {
      alert("Vehicle ID is required");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Remember inputs in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("driver_shuttleId", formData.shuttleId);
      localStorage.setItem("driver_name", formData.driverName);
      localStorage.setItem("driver_zone", formData.zone);
    }

    const payload = {
      shuttleId: formData.shuttleId.toUpperCase().trim(),
      driverName: formData.driverName.trim() || undefined,
      zone: formData.zone.toUpperCase().trim() || undefined,
      passengerLoad: formData.passengerLoad,
      lat: lat || undefined,
      lng: lng || undefined,
    };

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (mode === "online") {
      try {
        const response = await apiClient.post<{ success: boolean }>("/api/shuttles/checkin", payload);
        if (response.success) {
          setSubmitStatus("success");
          setLastCheckinTime(now);
          localStorage.setItem("driver_lastCheckinTime", now);
        } else {
          // Fall back to offline queue
          await enqueue("shuttle_checkin", payload);
          setSubmitStatus("queued");
          setLastCheckinTime(now);
          localStorage.setItem("driver_lastCheckinTime", now);
        }
      } catch (err) {
        // Fall back to offline queue
        await enqueue("shuttle_checkin", payload);
        setSubmitStatus("queued");
        setLastCheckinTime(now);
        localStorage.setItem("driver_lastCheckinTime", now);
      }
    } else {
      // Offline queueing
      await enqueue("shuttle_checkin", payload);
      setSubmitStatus("queued");
      setLastCheckinTime(now);
      localStorage.setItem("driver_lastCheckinTime", now);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col min-h-full justify-between">
      <div className="space-y-4">
        {/* Success Alert */}
        {submitStatus === "success" && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 p-4 rounded-xl flex items-start gap-3 shadow-md animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">{t("checkinSuccess")}</h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Check-in broadcasted to logistics center.
              </p>
            </div>
          </div>
        )}

        {submitStatus === "queued" && (
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-md animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">{t("checkinQueued")}</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Saved locally. Auto sync when connection is restored.
              </p>
            </div>
          </div>
        )}

        {/* Input Card Form */}
        <form onSubmit={handleSubmit} className="bg-[#0D1B4B]/30 border border-white/10 rounded-2xl p-5 space-y-4">
          {/* Shuttle ID */}
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bus className="h-4 w-4" />
              <span>{t("vehicleId")} *</span>
            </label>
            <input
              type="text"
              name="shuttleId"
              value={formData.shuttleId}
              onChange={handleInputChange}
              placeholder={t("vehicleIdPlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder-white/35 focus:outline-none focus:border-blue-400 text-lg uppercase"
              required
            />
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{t("driverName")}</span>
            </label>
            <input
              type="text"
              name="driverName"
              value={formData.driverName}
              onChange={handleInputChange}
              placeholder={t("driverNamePlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder-white/35 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Zone and Passenger Load Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Map className="h-4 w-4" />
                <span>{t("zone")}</span>
              </label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleInputChange}
                placeholder={t("zonePlaceholder")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder-white/35 focus:outline-none focus:border-blue-400 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{t("passengerLoad")}</span>
              </label>
              <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => incrementLoad(-5)}
                  className="px-3 bg-white/5 font-bold hover:bg-white/10 text-white text-lg active:scale-95 transition-all"
                >
                  -
                </button>
                <input
                  type="number"
                  name="passengerLoad"
                  value={formData.passengerLoad || ""}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-0 text-center text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-lg"
                />
                <button
                  type="button"
                  onClick={() => incrementLoad(5)}
                  className="px-3 bg-white/5 font-bold hover:bg-white/10 text-white text-lg active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Location status coordinates */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <span className="font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </span>
            <div className="flex items-center gap-2">
              {lat !== null && lng !== null ? (
                <span className="font-mono text-emerald-400 font-bold">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              ) : (
                <span className="text-white/40">Tracking location...</span>
              )}
              <button
                type="button"
                onClick={trackLocation}
                className="p-1 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-blue-200 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Large prominent check-in action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 bg-blue-500 hover:bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:bg-slate-700 disabled:shadow-none"
          >
            {isSubmitting ? (
              <RefreshCw className="h-7 w-7 animate-spin mx-auto" />
            ) : (
              t("iAmHere")
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-3 py-6 shrink-0 border-t border-white/5 mt-6">
        {lastCheckinTime && (
          <p className="text-sm font-bold text-blue-300">
            {t("lastCheckin")}: <span className="text-white">{lastCheckinTime}</span>
          </p>
        )}
        <div className="text-[10px] text-white/45 font-bold uppercase tracking-widest leading-relaxed">
          <p>{t("checkInWhenStop")}</p>
          <p>{t("locationRecorded")}</p>
        </div>
      </div>
    </div>
  );
}
