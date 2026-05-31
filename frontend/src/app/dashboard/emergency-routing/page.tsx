/**
 * Emergency Routing Page (/dashboard/emergency-routing)
 *
 * Purpose:
 *   - Two inputs for origin and destination (text for now, map click later)
 *   - Submit button to call routing API
 *   - Map area to render returned route path
 *   - Estimated time and distance display
 *
 * Components that will go here:
 *   - Location input fields
 *   - Route calculation button
 *   - Results map view
 *   - Route instructions list
 *   - Send to shuttle button
 */

"use client";

import { useState } from "react";

interface RouteInput {
  origin: string;
  destination: string;
}

export default function EmergencyRoutingPage(): JSX.Element {
  const [routeInput, setRouteInput] = useState<RouteInput>({
    origin: "",
    destination: "",
  });
  const [loading, setLoading] = useState(false);
  const [routeFound, setRouteFound] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRouteInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Route calculation logic will go here
    setTimeout(() => {
      setLoading(false);
      setRouteFound(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Emergency Routing</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Calculate optimal routes for emergency response
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border border-border bg-white p-4 lg:p-6">
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Origin */}
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-primary-900 mb-1">
                From (Origin)
              </label>
              <input
                id="origin"
                name="origin"
                type="text"
                value={routeInput.origin}
                onChange={handleChange}
                placeholder="e.g., Medical Tent, Zone A"
                className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
                disabled={loading}
              />
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-primary-900 mb-1">
                To (Destination)
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                value={routeInput.destination}
                onChange={handleChange}
                placeholder="e.g., Hospital, 10 miles away"
                className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-500 px-6 py-3 font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Calculating route..." : "Calculate Route"}
          </button>
        </form>
      </div>

      {/* Route Results */}
      {routeFound && (
        <div className="flex-1 flex flex-col gap-4 rounded-lg border border-border bg-white overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 bg-surface flex items-center justify-center">
            <div className="text-center space-y-2 text-text-secondary">
              <p className="text-lg">🗺️</p>
              <p className="text-sm">Route visualization</p>
              <p className="text-xs text-text-muted">
                Map showing calculated emergency route
              </p>
            </div>
          </div>

          {/* Route Summary */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="grid gap-4 grid-cols-3">
              <div>
                <p className="text-xs text-text-muted">Distance</p>
                <p className="font-bold text-primary-900">8.2 km</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Estimated Time</p>
                <p className="font-bold text-primary-900">12 min</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Route Status</p>
                <p className="font-bold text-success-base">Optimal</p>
              </div>
            </div>

            {/* Send to Shuttle */}
            <button className="w-full rounded-lg bg-primary-900 px-4 py-2 font-semibold text-white hover:bg-primary-800 transition-colors">
              Send to Assigned Shuttle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
