/**
 * Shuttle Management Page (/dashboard/shuttles)
 *
 * Purpose:
 *   - List of all active shuttle buses
 *   - Shows: vehicle ID, last check-in location, check-in time
 *   - Recommended next stop per bus
 *   - Status indicators (active, offline, in maintenance)
 *
 * Components that will go here:
 *   - Shuttle list table or cards
 *   - Filter/sort controls
 *   - Real-time status updates
 *   - Detail view modal
 */

"use client";

export default function ShuttlesPage(): JSX.Element {
  const shuttles = [
    {
      id: "1",
      vehicleId: "SH-001",
      driverName: "John Smith",
      lastLocation: "Zone A - Medical Tent",
      lastCheckIn: "2 min ago",
      passengers: "24/50",
      status: "active",
      nextStop: "Water Station B",
    },
    {
      id: "2",
      vehicleId: "SH-002",
      driverName: "Maria Garcia",
      lastLocation: "Zone C - Parking",
      lastCheckIn: "5 min ago",
      passengers: "18/50",
      status: "active",
      nextStop: "Information Booth",
    },
    {
      id: "3",
      vehicleId: "SH-003",
      driverName: "Ahmed Hassan",
      lastLocation: "Zone B - Food Area",
      lastCheckIn: "15 min ago",
      passengers: "0/50",
      status: "offline",
      nextStop: "—",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success-light text-success-dark";
      case "offline":
        return "bg-warning-light text-warning-dark";
      default:
        return "bg-surface text-text-secondary";
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Shuttle Management</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track and manage all active shuttle buses
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by vehicle ID or driver..."
          className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <select className="rounded-lg border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500">
          <option>All Status</option>
          <option>Active</option>
          <option>Offline</option>
          <option>Maintenance</option>
        </select>
      </div>

      {/* Shuttles Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Driver</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Last Location
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Last Check-in
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-900">
                Next Stop
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shuttles.map((shuttle) => (
              <tr key={shuttle.id} className="hover:bg-surface transition-colors">
                <td className="px-4 py-3 font-medium text-primary-900">{shuttle.vehicleId}</td>
                <td className="px-4 py-3 text-text-secondary">{shuttle.driverName}</td>
                <td className="px-4 py-3 text-text-secondary">{shuttle.lastLocation}</td>
                <td className="px-4 py-3 text-text-secondary">{shuttle.lastCheckIn}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      shuttle.status
                    )}`}
                  >
                    {shuttle.status.charAt(0).toUpperCase() + shuttle.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{shuttle.nextStop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
