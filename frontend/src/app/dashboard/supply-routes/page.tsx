/**
 * Supply Route Optimization Page (/dashboard/supply-routes)
 *
 * Purpose:
 *   - Input area to add multiple delivery points
 *   - Submit button to send to optimization API
 *   - Map area to render the optimized route with all stops
 *   - Display route efficiency score
 *   - Export or assign route to shuttle
 *
 * Components that will go here:
 *   - Add location input (repeatable)
 *   - Remove location buttons
 *   - Optimize route button
 *   - Map with route visualization
 *   - Stop sequence list
 *   - Export/assign controls
 */

"use client";

import { useState } from "react";

interface DeliveryPoint {
  id: string;
  location: string;
}

export default function SupplyRoutesPage(): JSX.Element {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([
    { id: "1", location: "" },
  ]);
  const [optimized, setOptimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddPoint = () => {
    const newId = String(Math.max(...deliveryPoints.map((p) => parseInt(p.id)), 0) + 1);
    setDeliveryPoints([...deliveryPoints, { id: newId, location: "" }]);
  };

  const handleRemovePoint = (id: string) => {
    setDeliveryPoints(deliveryPoints.filter((p) => p.id !== id));
  };

  const handleLocationChange = (id: string, value: string) => {
    setDeliveryPoints(
      deliveryPoints.map((p) => (p.id === id ? { ...p, location: value } : p))
    );
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Optimization API call will go here
    setTimeout(() => {
      setLoading(false);
      setOptimized(true);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-900">Supply Route Optimizer</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Optimize delivery routes for multiple stops
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 h-full">
        {/* Input Panel */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-white p-4 overflow-auto">
          <form onSubmit={handleOptimize} className="space-y-3">
            <h2 className="font-semibold text-primary-900">Delivery Points</h2>

            {/* Delivery Points List */}
            <div className="space-y-2 max-h-48 overflow-auto">
              {deliveryPoints.map((point, index) => (
                <div key={point.id} className="flex gap-2">
                  <div className="flex-1 flex flex-col">
                    <label htmlFor={`location-${point.id}`} className="text-xs font-medium text-text-muted mb-1">
                      Stop {index + 1}
                    </label>
                    <input
                      id={`location-${point.id}`}
                      type="text"
                      value={point.location}
                      onChange={(e) => handleLocationChange(point.id, e.target.value)}
                      placeholder="e.g., Tent A, Building C"
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                      required
                    />
                  </div>
                  {deliveryPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(point.id)}
                      className="mt-auto rounded-lg border border-error-base bg-error-light px-2 py-2 text-sm text-error-base hover:bg-error-light transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Point Button */}
            <button
              type="button"
              onClick={handleAddPoint}
              className="w-full rounded-lg border-2 border-accent-500 px-3 py-2 text-sm font-semibold text-accent-500 hover:bg-accent-50 transition-colors"
            >
              + Add Stop
            </button>

            {/* Optimize Button */}
            <button
              type="submit"
              disabled={loading || deliveryPoints.length < 2}
              className="w-full rounded-lg bg-primary-900 px-4 py-3 font-semibold text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Optimizing..." : "Optimize Route"}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Map */}
          <div className="flex-1 rounded-lg border border-border bg-surface flex items-center justify-center">
            <div className="text-center space-y-2 text-text-secondary">
              <p className="text-lg">🗺️</p>
              <p className="text-sm">Route optimization map</p>
              <p className="text-xs text-text-muted">
                Optimized route with stop sequence will appear here
              </p>
            </div>
          </div>

          {/* Optimization Results */}
          {optimized && (
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <div className="grid gap-4 grid-cols-3">
                <div>
                  <p className="text-xs text-text-muted">Total Distance</p>
                  <p className="font-bold text-primary-900">3.2 km</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Estimated Time</p>
                  <p className="font-bold text-primary-900">18 min</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Efficiency</p>
                  <p className="font-bold text-success-base">94%</p>
                </div>
              </div>

              <div className="grid gap-2 grid-cols-2">
                <button className="rounded-lg bg-primary-900 px-4 py-2 font-semibold text-white hover:bg-primary-800 transition-colors">
                  Save Route
                </button>
                <button className="rounded-lg border-2 border-accent-500 px-4 py-2 font-semibold text-accent-500 hover:bg-accent-50 transition-colors">
                  Assign to Shuttle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
