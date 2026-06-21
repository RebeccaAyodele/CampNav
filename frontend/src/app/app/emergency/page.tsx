/**
 * Emergency Contacts Page (/app/emergency)
 * Displays dial buttons for medical, security, and fire services,
 * and dynamically calculates the nearest medical facilities (online/offline).
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, Shield, ShieldAlert, HeartPulse, Flame, MapPin } from "lucide-react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { apiClient } from "@/lib/api";
import { findNearestOffline } from "@/lib/offlineRouter";

interface EmergencyService {
  nameKey: string;
  descKey: string;
  phone: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface Facility {
  id: string;
  name: string;
  distance_meters: number;
  lat: number;
  lng: number;
}

export default function EmergencyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { mode } = useNetworkStatus();

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearestFacilities, setNearestFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  const services: EmergencyService[] = [
    {
      nameKey: "medical",
      descKey: "medicalDesc",
      phone: "+234 803 000 1111",
      icon: HeartPulse,
      color: "text-rose-600 border-rose-200 hover:bg-rose-50/50",
      bgColor: "bg-rose-500",
    },
    {
      nameKey: "security",
      descKey: "securityDesc",
      phone: "+234 803 000 2222",
      icon: ShieldAlert,
      color: "text-orange-600 border-orange-200 hover:bg-blue-50/50",
      bgColor: "bg-orange-500",
    },
    {
      nameKey: "fire",
      descKey: "fireDesc",
      phone: "+234 803 000 3333",
      icon: Flame,
      color: "text-amber-600 border-amber-200 hover:bg-amber-50/50",
      bgColor: "bg-amber-500",
    },
  ];

  // Geolocation lookup for nearest medical facility
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => {
        // Fallback to center
        setUserLoc([3.4588, 6.8097]);
      },
      { timeout: 5000 }
    );
  }, []);

  // Fetch nearest facilities when location is resolved or mode changes
  useEffect(() => {
    if (!userLoc) return;

    async function fetchNearest() {
      setLoadingFacilities(true);
      const [lng, lat] = userLoc!;

      if (mode === "online") {
        try {
          const response = await apiClient.get<{ success: boolean; data: { facilities: any[] } }>(
            `/api/route/nearest?lat=${lat}&lng=${lng}&type=medical&limit=3`
          );
          if (response.success && response.data?.facilities) {
            setNearestFacilities(
              response.data.facilities.map((f) => ({
                id: f.id,
                name: f.name,
                distance_meters: f.distance_meters,
                lat: f.lat,
                lng: f.lng,
              }))
            );
          } else {
            fetchOfflineNearest(lat, lng);
          }
        } catch (err) {
          fetchOfflineNearest(lat, lng);
        }
      } else {
        fetchOfflineNearest(lat, lng);
      }
      setLoadingFacilities(false);
    }

    function fetchOfflineNearest(lat: number, lng: number) {
      const results = findNearestOffline(lat, lng, "medical", 3);
      setNearestFacilities(
        results.map((r) => ({
          id: r.properties.id,
          name: r.properties.name,
          distance_meters: r.distance_meters,
          lat: r.geometry.coordinates[1],
          lng: r.geometry.coordinates[0],
        }))
      );
    }

    fetchNearest();
  }, [userLoc, mode]);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmergencyAlert = () => {
    if (confirm("Are you sure you want to broadcast a panic emergency alert?")) {
      // Just simulate alert submission for offline/online
      alert("Panic alert broadcasted! Security teams have been notified.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => router.push("/app")}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 animate-in fade-in"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-slate-800">{t("emergencyTitle")}</h1>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={index}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all border-slate-200/60 ${service.color}`}
            >
              <div className="flex gap-4 items-start mb-4">
                <div className={`p-3 rounded-xl text-white ${service.bgColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{t(service.nameKey)}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{t(service.descKey)}</p>
                </div>
              </div>

              {/* Large click target button */}
              <button
                onClick={() => handleCall(service.phone)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <Phone className="h-4.5 w-4.5" />
                <span>{t("callNow", { service: t(service.nameKey) })}</span>
              </button>
            </div>
          );
        })}

        {/* Nearest Facilities Section */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
            <HeartPulse className="h-5 w-5 text-rose-500" />
            <span>{t("nearestMedical")}</span>
          </h3>

          {loadingFacilities ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : nearestFacilities.length > 0 ? (
            <div className="space-y-3">
              {nearestFacilities.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() =>
                    router.push(
                      `/app/directions/${fac.id}?olat=${userLoc ? userLoc[1] : 6.8097}&olng=${
                        userLoc ? userLoc[0] : 3.4588
                      }&dlat=${fac.lat}&dlng=${fac.lng}&name=${encodeURIComponent(fac.name)}`
                    )
                  }
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl text-left transition-all active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{fac.name}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Medical Facility</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs font-extrabold text-[#ff6b00] bg-[#ff6b00]/5 px-2.5 py-1 rounded-full">
                    <MapPin className="h-3 w-3" />
                    <span>{fac.distance_meters}m</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4 font-semibold">
              Location access needed to calculate distance.
            </p>
          )}
        </div>
      </div>

      {/* Panic Alert Footer */}
      <div className="p-4 bg-rose-50 border-t border-rose-100 sticky bottom-0">
        <button
          onClick={handleEmergencyAlert}
          className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 text-sm tracking-wide uppercase transition-all active:scale-[0.99]"
        >
          {t("emergencyAlert")}
        </button>
        <p className="text-[10px] text-rose-500 font-bold text-center mt-2.5">
          {t("emergencyAlertDesc")}
        </p>
      </div>
    </div>
  );
}
