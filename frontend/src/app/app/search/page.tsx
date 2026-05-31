/**
 * Search Results Page (/app/search)
 *
 * Purpose:
 *   - Shows list of locations matching search query
 *   - Each result shows: name, facility type, walking distance
 *   - Tap result to navigate to directions page (/app/directions/[id])
 *   - Back button to return to map
 *
 * Components that will go here:
 *   - SearchBar.tsx — reused from main map
 *   - LocationCardList — list of location results
 *   - Loading state (spinner)
 *   - Empty state message
 *   - Pagination or infinite scroll
 */

"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";

export default function SearchPage(): JSX.Element {
  const mockResults = [
    {
      id: "1",
      name: "Medical Clinic",
      type: "Medical",
      distance: "240m",
    },
    {
      id: "2",
      name: "Water Station A",
      type: "Water Station",
      distance: "150m",
    },
    {
      id: "3",
      name: "Information Booth",
      type: "Information Booth",
      distance: "380m",
    },
  ];

  return (
    <div className="flex flex-col h-full gap-4 bg-white">
      {/* Search Bar */}
      <div className="border-b border-border p-3 shadow-sm">
        <div className="container mx-auto flex gap-2 items-center">
          <Link
            href={ROUTES.APP}
            className="text-primary-900 hover:text-primary-700 transition-colors"
          >
            ← Back
          </Link>
          <input
            type="text"
            placeholder="Search locations..."
            defaultValue=""
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto divide-y divide-border">
          {mockResults.length > 0 ? (
            mockResults.map((result) => (
              <Link
                key={result.id}
                href={`${ROUTES.APP_DIRECTIONS}/${result.id}`}
                className="block p-4 hover:bg-surface transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-primary-900">{result.name}</h3>
                  <p className="text-sm text-text-secondary">{result.type}</p>
                  <p className="text-xs text-text-muted">📍 {result.distance}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex items-center justify-center h-48 text-center">
              <div>
                <p className="text-text-secondary">No results found</p>
                <p className="text-sm text-text-muted">Try a different search term</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
