/**
 * Directions Screen (/app/directions/[id])
 *
 * Purpose:
 *   - Shows destination on map with route drawn
 *   - Step-by-step turn-by-turn directions below map
 *   - "I have arrived" button at bottom
 *   - Dynamic route parameter: location id
 *
 * Components that will go here:
 *   - MapView.tsx — map with route drawn
 *   - DirectionsList.tsx — step-by-step instructions
 *   - Distance and time estimate
 *   - Arrival confirmation button
 */

"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";

interface DirectionsPageProps {
  params: { id: string };
}

export default function DirectionsPage({ params }: DirectionsPageProps): JSX.Element {
  const locationId = params.id;

  const mockSteps = [
    { order: 1, instruction: "Head north on Main Street", distance: "120m" },
    { order: 2, instruction: "Turn right on Oak Avenue", distance: "95m" },
    { order: 3, instruction: "Destination on your right", distance: "0m" },
  ];

  return (
    <div className="flex flex-col h-full gap-4 bg-white">
      {/* Header */}
      <div className="border-b border-border p-3 shadow-sm">
        <div className="container mx-auto flex items-center gap-2">
          <Link
            href={ROUTES.APP_SEARCH}
            className="text-primary-900 hover:text-primary-700 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-primary-900">Medical Clinic</h1>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-48 bg-surface flex items-center justify-center text-text-secondary">
        <div className="text-center space-y-2">
          <p className="text-lg">🗺️</p>
          <p className="text-sm">Map with route (location: {locationId})</p>
        </div>
      </div>

      {/* Distance and Time Summary */}
      <div className="px-4 py-3 bg-surface border-b border-border">
        <div className="container mx-auto flex gap-6">
          <div>
            <p className="text-xs text-text-muted">Distance</p>
            <p className="font-semibold text-primary-900">215m</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Estimated Time</p>
            <p className="font-semibold text-primary-900">3 minutes</p>
          </div>
        </div>
      </div>

      {/* Directions List */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto divide-y divide-border">
          {mockSteps.map((step) => (
            <div key={step.order} className="p-4 flex gap-4">
              <div className="text-2xl">{step.order}</div>
              <div className="flex-1">
                <p className="font-medium text-primary-900">{step.instruction}</p>
                <p className="text-xs text-text-muted">{step.distance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrival Button */}
      <div className="border-t border-border bg-surface p-4">
        <button className="w-full rounded-lg bg-success-base px-6 py-3 font-semibold text-white hover:bg-success-dark transition-colors">
          I Have Arrived
        </button>
      </div>
    </div>
  );
}
