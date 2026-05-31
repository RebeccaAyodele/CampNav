/**
 * Lost Persons Feed Page (/dashboard/lost-persons)
 *
 * Purpose:
 *   - List of all submitted lost person reports in reverse chronological order
 *   - Each entry shows: description, time submitted, last known location, status
 *   - Status dropdown to update: Open, Found, Closed
 *   - Filter and search controls
 *
 * Components that will go here:
 *   - Lost person report cards or table rows
 *   - Status update dropdown
 *   - Filter/search controls
 *   - Location map preview
 *   - Detail view modal
 */

"use client";

import { useState } from "react";

interface LostPersonReport {
  id: string;
  description: string;
  submittedAt: string;
  location: string;
  status: "open" | "located" | "closed";
  reporter: string;
}

export default function LostPersonsPage(): JSX.Element {
  const [reports, setReports] = useState<LostPersonReport[]>([
    {
      id: "1",
      description: "Male, ~35 years old, blue shirt, glasses",
      submittedAt: "10 min ago",
      location: "Near medical tent, Zone A",
      status: "open",
      reporter: "Sarah Johnson",
    },
    {
      id: "2",
      description: "Female child, ~7 years old, pink backpack",
      submittedAt: "25 min ago",
      location: "Food court area",
      status: "located",
      reporter: "Alex Garcia",
    },
    {
      id: "3",
      description: "Elderly woman with white hair, walker",
      submittedAt: "2 hours ago",
      location: "Parking lot C",
      status: "closed",
      reporter: "James Smith",
    },
  ]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setReports(
      reports.map((r) =>
        r.id === id ? { ...r, status: newStatus as LostPersonReport["status"] } : r
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-error-light text-error-dark";
      case "located":
        return "bg-warning-light text-warning-dark";
      case "closed":
        return "bg-success-light text-success-dark";
      default:
        return "bg-surface text-text-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Lost Person Reports</h1>
        <p className="mt-1 text-sm text-text-secondary">
          All submitted reports in reverse chronological order
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search reports..."
          className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <select className="rounded-lg border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500">
          <option>All Status</option>
          <option>Open</option>
          <option>Located</option>
          <option>Closed</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-auto space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-border bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-primary-900">{report.description}</p>
                <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-text-muted">Submitted</p>
                    <p>{report.submittedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Last Known Location</p>
                    <p>{report.location}</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted">Reporter: {report.reporter}</p>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  value={report.status}
                  onChange={(e) => handleStatusChange(report.id, e.target.value)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium border border-border focus:outline-none focus:ring-2 focus:ring-accent-500 ${getStatusColor(
                    report.status
                  )}`}
                >
                  <option value="open">Open</option>
                  <option value="located">Located</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
