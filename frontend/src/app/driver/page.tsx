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
    <div className="relative min-h-full flex items-center justify-center p-4 text-slate-800 bg-white">
      {/* Background decoration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05]">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-600 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-600 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-50/70 border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-orange-50 border border-orange-200/80 rounded-2xl text-orange-600 mb-2">
            <Bus className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-indigo-600">
            {t("driverCheckin")}
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            CampNav Driver Portal
          </p>
        </div>

        {/* Success Alert */}
        {submitStatus === "success" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">{t("checkinSuccess")}</h4>
              <p className="text-xs text-emerald-700/90 mt-0.5">
                Check-in broadcasted to logistics center.
              </p>
            </div>
          </div>
        )}

        {/* Queued Alert */}
        {submitStatus === "queued" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm">{t("checkinQueued")}</h4>
              <p className="text-xs text-amber-700/90 mt-0.5">
                Saved locally. Auto sync when connection is restored.
              </p>
            </div>
          </div>
        )}

        {/* Input Card Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shuttle ID */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              {t("vehicleId")} *
            </label>
            <div className="relative">
              <Bus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="shuttleId"
                value={formData.shuttleId}
                onChange={handleInputChange}
                placeholder={t("vehicleIdPlaceholder")}
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-lg uppercase"
                required
              />
            </div>
          </div>

          {/* Driver Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              {t("driverName")}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleInputChange}
                placeholder={t("driverNamePlaceholder")}
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Zone and Passenger Load Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                {t("zone")}
              </label>
              <div className="relative">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder={t("zonePlaceholder")}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                {t("passengerLoad")}
              </label>
              <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden h-[46px] items-stretch">
                <button
                  type="button"
                  onClick={() => incrementLoad(-5)}
                  className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg active:scale-95 transition-all focus:outline-none"
                >
                  -
                </button>
                <input
                  type="number"
                  name="passengerLoad"
                  value={formData.passengerLoad || ""}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-0 text-center text-slate-800 font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-lg"
                />
                <button
                  type="button"
                  onClick={() => incrementLoad(5)}
                  className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-lg active:scale-95 transition-all focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Location status coordinates */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span>Location</span>
            </span>
            <div className="flex items-center gap-2">
              {lat !== null && lng !== null ? (
                <span className="font-mono text-emerald-700 font-bold">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              ) : (
                <span className="text-slate-400">Tracking location...</span>
              )}
              <button
                type="button"
                onClick={trackLocation}
                className="p-1 rounded bg-slate-100 hover:bg-slate-250 active:scale-95 text-slate-600 hover:text-slate-800 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Large prominent check-in action button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-orange-600/10 active:scale-[0.99] transition-all text-lg"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>{t("iAmHere")}</span>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="text-center space-y-3 pt-6 border-t border-slate-200 mt-6">
          {lastCheckinTime && (
            <p className="text-sm font-bold text-slate-500">
              {t("lastCheckin")}: <span className="text-slate-800 font-extrabold">{lastCheckinTime}</span>
            </p>
          )}
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            <p>{t("checkInWhenStop")}</p>
            <p>{t("locationRecorded")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
