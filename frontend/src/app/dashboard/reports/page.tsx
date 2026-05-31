/**
 * Activity Log / Reports Page (/dashboard/reports)
 *
 * Purpose:
 *   - Read-only table of all system activities and events
 *   - Shows: check-ins, route requests, resolved cases with timestamps
 *   - Filter by activity type
 *   - Sortable columns
 *   - Export functionality (button placeholder)
 *
 * Components that will go here:
 *   - Activity log table
 *   - Filter controls
 *   - Sort controls
 *   - Date range picker
 *   - Export button
 */

"use client";

import { useState } from "react";

interface ActivityLog {
  id: string;
  type: "check_in" | "route_request" | "report_resolved" | "user_login";
  description: string;
  user?: string;
  timestamp: string;
  details?: string;
}

export default function ReportsPage(): JSX.Element {
  const [logs] = useState<ActivityLog[]>([
    {
      id: "1",
      type: "check_in",
      description: "Shuttle SH-001 checked in",
      user: "John Smith",
      timestamp: "2 min ago",
      details: "Zone A - Medical Tent",
    },
    {
      id: "2",
      type: "route_request",
      description: "Emergency route requested",
      user: "Admin User",
      timestamp: "5 min ago",
      details: "From Medical to Hospital",
    },
    {
      id: "3",
      type: "report_resolved",
      description: "Lost person case closed",
      user: "Sarah Johnson",
      timestamp: "12 min ago",
      details: "Person found and reunited",
    },
    {
      id: "4",
      type: "user_login",
      description: "Admin logged in",
      user: "admin@campnav.local",
      timestamp: "18 min ago",
      details: "From IP 192.168.1.100",
    },
    {
      id: "5",
      type: "check_in",
      description: "Shuttle SH-002 checked in",
      user: "Maria Garcia",
      timestamp: "22 min ago",
      details: "Zone C - Parking",
    },
  ]);

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "check_in":
        return "📍";
      case "route_request":
        return "🗺️";
      case "report_resolved":
        return "✅";
      case "user_login":
        return "🔐";
      default:
        return "📋";
    }
  };

  const getTypeLabel = (type: string): string => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Activity Log</h1>
          <p className="mt-1 text-sm text-text-secondary">
            System events and user activities
          </p>
        </div>
        <button className="rounded-lg border border-accent-500 px-4 py-2 font-semibold text-accent-500 hover:bg-accent-50 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search activities..."
          className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <select className="rounded-lg border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500">
          <option>All Activities</option>
          <option>Check-in</option>
          <option>Route Request</option>
          <option>Report Resolved</option>
          <option>User Login</option>
        </select>
      </div>

      {/* Activity Log Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Description
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">User</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-surface transition-colors">
                <td className="px-4 py-3 text-center text-lg">
                  {getTypeIcon(log.type)}
                </td>
                <td className="px-4 py-3 font-medium text-primary-900">
                  {getTypeLabel(log.type)}
                </td>
                <td className="px-4 py-3 text-text-secondary">{log.user || "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{log.timestamp}</td>
                <td className="px-4 py-3 text-text-muted">{log.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
