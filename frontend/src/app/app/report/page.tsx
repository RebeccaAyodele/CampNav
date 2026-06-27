/**
 * Lost Person Report Form (/app/report)
 * Handles reporting lost persons with auto geolocation, online direct submit,
 * and offline IndexedDB queue fallback.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, RefreshCw, Send, CheckCircle2, AlertTriangle, Camera, X } from "lucide-react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { apiClient } from "@/lib/api";
import { enqueue } from "@/lib/offlineQueue";

interface ReportFormData {
  description: string;
  name: string;
  reporterName: string;
  reporterPhone: string;
  lastSeenLocation: string;
  lat: number | null;
  lng: number | null;
  imageUrl: string;
}

export default function LostPersonReportPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { mode, queueCount } = useNetworkStatus();

  const [formData, setFormData] = useState<ReportFormData>({
    description: "",
    name: "",
    reporterName: "",
    reporterPhone: "",
    lastSeenLocation: "",
    lat: null,
    lng: null,
    imageUrl: "",
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "queued" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Error capturing location:", error);
        alert("Failed to retrieve location. Please make sure location permissions are enabled.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    const payload = {
      description: formData.description,
      name: formData.name || undefined,
      reporterName: formData.reporterName || undefined,
      reporterPhone: formData.reporterPhone || undefined,
      lastSeenLocation: formData.lastSeenLocation || undefined,
      lat: formData.lat || undefined,
      lng: formData.lng || undefined,
      source: "app",
      imageUrl: formData.imageUrl || undefined,
    };

    if (mode === "online") {
      try {
        const response = await apiClient.post<{ success: boolean }>("/api/lost-persons", payload);
        if (response.success) {
          setSubmitStatus("success");
          resetForm();
        } else {
          setSubmitStatus("error");
          setErrorMessage("Failed to send report. Saving locally instead...");
          // Fall back to offline queue if API failed
          await enqueue("lost_person", payload);
          setSubmitStatus("queued");
          resetForm();
        }
      } catch (err: any) {
        // Fall back to offline queue if request failed
        await enqueue("lost_person", payload);
        setSubmitStatus("queued");
        resetForm();
      }
    } else {
      // Offline Mode: Queue it!
      await enqueue("lost_person", payload);
      setSubmitStatus("queued");
      resetForm();
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      name: "",
      reporterName: "",
      reporterPhone: "",
      lastSeenLocation: "",
      lat: null,
      lng: null,
      imageUrl: "",
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button
          onClick={() => router.push("/app")}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800">{t("reportTitle")}</h1>
          {queueCount > 0 && (
            <p className="text-xs text-amber-500 font-medium">
              {t("queuedItems", { count: queueCount })}
            </p>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        {submitStatus === "success" && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{t("reportSent")}</h4>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Our support team has been notified.
              </p>
            </div>
          </div>
        )}

        {submitStatus === "queued" && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{t("reportQueued")}</h4>
              <p className="text-xs text-amber-700/80 mt-0.5">
                It will automatically sync as soon as you have internet connection.
              </p>
            </div>
          </div>
        )}

        {mode === "offline" && (
          <div className="mb-4 bg-amber-100/60 border border-amber-200/50 text-amber-800 p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">{t("offlineNotice")}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          {/* Name or Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {t("nameOrDescription")} *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t("nameOrDescriptionPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 font-medium"
              rows={3}
              required
            />
          </div>

          {/* Person's Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {t("personName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("personNamePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 font-medium"
            />
          </div>

          {/* Last Seen Location */}
          <div>
            <label htmlFor="lastSeenLocation" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {t("lastSeenLocation")}
            </label>
            <input
              id="lastSeenLocation"
              name="lastSeenLocation"
              type="text"
              value={formData.lastSeenLocation}
              onChange={handleChange}
              placeholder={t("lastSeenLocationPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 font-medium"
            />
          </div>

          {/* Photo upload (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Photo (Optional)
            </label>
            {formData.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-xs text-slate-500 font-medium">Photo attached</span>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-300 hover:border-[#ff6b00] bg-slate-50 hover:bg-orange-50/20 px-4 py-4 cursor-pointer text-sm text-slate-600 transition-all font-semibold active:scale-[0.99]">
                <Camera className="h-5 w-5 text-slate-400" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Coordinates (lat/lng) capture */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Location Coordinates
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm text-slate-500 font-medium min-h-[46px] flex items-center">
                {formData.lat !== null && formData.lng !== null ? (
                  <span className="text-slate-700">
                    {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-slate-400">Not captured yet</span>
                )}
              </div>
              <button
                type="button"
                onClick={captureLocation}
                className={`px-4 rounded-xl border border-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isLocating
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95"
                }`}
                disabled={isLocating}
              >
                <MapPin className={`h-4 w-4 ${isLocating ? "animate-bounce" : ""}`} />
                <span>{isLocating ? "Locating..." : t("useCurrentLocation")}</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Reporter Name */}
          <div>
            <label htmlFor="reporterName" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {t("reporterName")}
            </label>
            <input
              id="reporterName"
              name="reporterName"
              type="text"
              value={formData.reporterName}
              onChange={handleChange}
              placeholder={t("reporterNamePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 font-medium"
            />
          </div>

          {/* Reporter Phone */}
          <div>
            <label htmlFor="reporterPhone" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              {t("reporterPhone")} *
            </label>
            <input
              id="reporterPhone"
              name="reporterPhone"
              type="tel"
              value={formData.reporterPhone}
              onChange={handleChange}
              placeholder={t("reporterPhonePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 text-slate-800 font-medium"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-[#ff6b00] hover:bg-orange-900 text-white rounded-xl font-bold shadow-lg shadow-[#ff6b00]/25 transition-all active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none"
          >
            {isSubmitting ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span>{isSubmitting ? "Submitting..." : t("submitReport")}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
