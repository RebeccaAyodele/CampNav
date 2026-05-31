/**
 * DirectionsList Component
 *
 * Purpose:
 *   - Displays step-by-step turn-by-turn directions
 *   - Shows distance and duration for each step
 *   - Highlights current step
 *   - Scrollable list format
 *
 * Props:
 *   - steps: Array<RouteStep> — array of direction steps
 *   - currentStepIndex?: number — index of current step
 *   - totalDistance?: number — total route distance in meters
 *   - totalDuration?: number — total route duration in seconds
 *   - onStepClick?: (index: number) => void — callback when user clicks a step
 */

import type { RouteStep } from "@/types";

interface DirectionsListProps {
  steps: RouteStep[];
  currentStepIndex?: number;
  totalDistance?: number;
  totalDuration?: number;
  onStepClick?: (index: number) => void;
}

export default function DirectionsList({
  steps,
  currentStepIndex = 0,
  totalDistance,
  totalDuration,
  onStepClick,
}: DirectionsListProps): JSX.Element {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}min`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Summary Header */}
      {totalDistance !== undefined && totalDuration !== undefined && (
        <div className="bg-surface border-b border-border p-3">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-text-muted">Total Distance</p>
              <p className="font-semibold text-primary-900">
                {formatDistance(totalDistance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Est. Time</p>
              <p className="font-semibold text-primary-900">
                {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => onStepClick?.(idx)}
              className={`w-full text-left p-4 transition-colors ${
                idx === currentStepIndex
                  ? "bg-accent-50 border-l-4 border-accent-500"
                  : "hover:bg-surface"
              }`}
            >
              <div className="flex gap-3">
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary-900 text-white font-semibold text-sm">
                  {idx + 1}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-900 truncate">
                    {step.instruction}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistance(step.distance)} • {formatDuration(step.duration)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TODO: Implement voice navigation */}
      {/* TODO: Add haptic feedback for turns */}
      {/* TODO: Show street names and road signs */}
    </div>
  );
}
