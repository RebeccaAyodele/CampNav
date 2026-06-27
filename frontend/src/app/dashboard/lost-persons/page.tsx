/**
 * Lost Persons Feed Page (/dashboard/lost-persons)
 * Lists all lost person reports with filtering, status change API,
 * WebSocket real-time updates, and pagination.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Calendar, MapPin, Phone, User, Radio, RefreshCw, Layers, ShieldCheck, Navigation } from "lucide-react";

import { apiClient } from "@/lib/api";
import { onEvent, offEvent } from "@/lib/socketClient";

interface LostPersonReport {
  id: string;
  name?: string;
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  lastSeenLocation?: string;
  lat?: number;
  lng?: number;
  source: "app" | "ussd" | "dashboard";
  status: "open" | "in_progress" | "resolved";
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LostPersonsPage() {
  const { t } = useTranslation();

  const [reports, setReports] = useState<LostPersonReport[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 15;

  const fetchReports = async (currentOffset: number, append: boolean = false) => {
    try {
      setLoading(true);
      const statusParam = filterStatus !== "all" ? `&status=${filterStatus}` : "";
      
      const response = await apiClient.get<{
        success: boolean;
        data: { total: number; reports: LostPersonReport[] };
      }>(`/api/lost-persons?limit=${LIMIT}&offset=${currentOffset}${statusParam}`);

      if (response.success && response.data) {
        setTotalCount(response.data.total);
        if (append) {
          setReports((prev) => [...prev, ...response.data.reports]);
        } else {
          setReports(response.data.reports);
        }
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reload reports when status filter changes
  useEffect(() => {
    setOffset(0);
    fetchReports(0, false);
  }, [filterStatus]);

  // Listen to WebSocket events
  useEffect(() => {
    const handleNewLostPerson = (data: LostPersonReport) => {
      // Show browser notification or alert if not filtered out
      if (filterStatus === "all" || filterStatus === data.status) {
        setReports((prev) => [data, ...prev]);
        setTotalCount((c) => c + 1);
      }
    };

    const handleStatusChanged = (data: { id: string; status: "open" | "in_progress" | "resolved" }) => {
      setReports((prev) =>
        prev.map((r) => (r.id === data.id ? { ...r, status: data.status } : r))
      );
    };

    onEvent<LostPersonReport>("new_lost_person", handleNewLostPerson);
    onEvent<{ id: string; status: "open" | "in_progress" | "resolved" }>(
      "lost_person_status_changed",
      handleStatusChanged
    );

    return () => {
      offEvent("new_lost_person", handleNewLostPerson);
      offEvent("lost_person_status_changed", handleStatusChanged);
    };
  }, [filterStatus]);

  const handleStatusChange = async (id: string, newStatus: "open" | "in_progress" | "resolved") => {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/api/lost-persons/${id}/status`,
        { status: newStatus }
      );
      if (response.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      alert("Failed to update status. Please try again.");
    }
  };

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchReports(nextOffset, true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
      case "in_progress":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "app":
        return "bg-orange-600/20 text-orange-400 border border-orange-500/30";
      case "ussd":
        return "bg-purple-600/20 text-purple-400 border border-purple-500/30";
      default:
        return "bg-slate-600/20 text-slate-400 border border-slate-500/30";
    }
  };

  // Local client side search filter
  const searchedReports = reports.filter((report) => {
    return (
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.reporterName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t("lostPersonReports")}</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            {t("lostPersonReportsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3.5 py-1.5 rounded-full">
          <Radio className="h-4 w-4 animate-pulse text-rose-400" />
          <span>REAL-TIME DISPATCH</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#ff6b00]/35 border border-white/5 p-4 rounded-2xl shadow-lg">
        <input
          type="text"
          placeholder="Filter description, person name or reporter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-orange-500 font-medium"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-bold uppercase tracking-wider"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Reports Feed */}
      {searchedReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchedReports.map((report) => (
            <div
              key={report.id}
              className="bg-[#ff6b00]/20 border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/10 transition-colors animate-in fade-in duration-200"
            >
              {/* Header: source, timestamp, status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getSourceBadge(report.source)}`}>
                    {report.source}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <select
                  value={report.status}
                  onChange={(e) => handleStatusChange(report.id, e.target.value as any)}
                  className={`bg-slate-900 font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${getStatusStyle(report.status)}`}
                >
                  <option value="open">{t("open")}</option>
                  <option value="in_progress">{t("inProgress")}</option>
                  <option value="resolved">{t("resolved")}</option>
                </select>
              </div>

              {/* Description body */}
              <div className="space-y-1">
                {report.name && (
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <User className="h-4.5 w-4.5 text-orange-400" />
                    <span>{report.name}</span>
                  </h3>
                )}
                <p className="text-sm text-slate-200 font-semibold leading-relaxed">
                  {report.description}
                </p>
                {report.imageUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 max-h-48 flex items-center justify-center bg-black/20">
                    <img
                      src={report.imageUrl}
                      alt={report.name || "Lost person"}
                      className="object-contain max-h-48 w-full"
                    />
                  </div>
                )}
              </div>

              <hr className="border-white/5" />

              {/* Meta details */}
              <div className="space-y-2 text-xs font-semibold text-slate-400">
                {report.lastSeenLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="truncate">Last seen: {report.lastSeenLocation}</span>
                  </div>
                )}
                {report.lat && report.lng && (
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    <Navigation className="h-4 w-4 text-orange-400 shrink-0" />
                    <span>GPS: {report.lat.toFixed(5)}, {report.lng.toFixed(5)}</span>
                  </div>
                )}
                {report.reporterName && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Reporter: {report.reporterName}</span>
                  </div>
                )}
                {report.reporterPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Phone: {report.reporterPhone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#ff6b00]/20 border border-white/5 rounded-3xl py-20 flex items-center justify-center text-slate-500 font-semibold">
          {loading ? (
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            "No reports match the active filters"
          )}
        </div>
      )}

      {/* Pagination Load More button */}
      {reports.length < totalCount && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff6b00]/50 hover:bg-[#ff6b00] border border-white/10 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-200 transition-all active:scale-[0.98]"
          >
            <Layers className="h-4 w-4" />
            <span>Load More Reports</span>
          </button>
        </div>
      )}
    </div>
  );
}
