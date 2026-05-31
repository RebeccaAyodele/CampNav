/**
 * LostPersonCard Component
 *
 * Purpose:
 *   - Display individual lost person report
 *   - Shows description, time submitted, location, status
 *   - Status update dropdown
 *   - Contact information
 *
 * Props:
 *   - report: LostPersonReport — the report data
 *   - onStatusChange?: (newStatus: string) => void — callback for status updates
 *   - onClick?: () => void — callback when card is clicked
 */

import type { LostPersonReport, LostPersonStatus } from "@/types";

interface LostPersonCardProps {
  report: LostPersonReport;
  onStatusChange?: (newStatus: LostPersonStatus) => void;
  onClick?: () => void;
}

export default function LostPersonCard({
  report,
  onStatusChange,
  onClick,
}: LostPersonCardProps): JSX.Element {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-error-light text-error-dark";
      case "located":
        return "bg-warning-light text-warning-dark";
      case "reunited":
        return "bg-success-light text-success-dark";
      case "closed":
        return "bg-surface text-text-secondary";
      default:
        return "bg-surface text-text-secondary";
    }
  };

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-border bg-white p-4 hover:shadow-md transition-shadow cursor-pointer space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-primary-900">{report.description}</h3>
          <p className="text-xs text-text-muted mt-1">{report.createdAt.toLocaleString()}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getStatusColor(
            report.status
          )}`}
        >
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid gap-2 text-sm">
        {report.approximateAge && (
          <div>
            <p className="text-xs text-text-muted">Age</p>
            <p className="text-text-secondary">~{report.approximateAge} years</p>
          </div>
        )}
        {report.lastKnownLocationDescription && (
          <div>
            <p className="text-xs text-text-muted">Last Known Location</p>
            <p className="text-text-secondary">{report.lastKnownLocationDescription}</p>
          </div>
        )}
        {report.reporterContactNumber && (
          <div>
            <p className="text-xs text-text-muted">Reporter Contact</p>
            <p className="text-text-secondary">{report.reporterContactNumber}</p>
          </div>
        )}
      </div>

      {/* Status Update Buttons */}
      {report.status === "open" && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.("located" as LostPersonStatus);
            }}
            className="flex-1 rounded-lg bg-warning-base px-3 py-2 text-xs font-medium text-white hover:bg-warning-dark transition-colors"
          >
            Located
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.("reunited" as LostPersonStatus);
            }}
            className="flex-1 rounded-lg bg-success-base px-3 py-2 text-xs font-medium text-white hover:bg-success-dark transition-colors"
          >
            Reunited
          </button>
        </div>
      )}

      {/* TODO: Add expand/detail view */}
      {/* TODO: Show report notes/updates history */}
      {/* TODO: Add media attachment preview */}
    </div>
  );
}
