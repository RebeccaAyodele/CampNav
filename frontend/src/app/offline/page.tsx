/**
 * Offline Fallback Page (/offline)
 *
 * Purpose:
 *   - Shown by PWA when a page is not cached
 *   - Reassures users that the app is still available
 *   - Provides link back to main app
 *   - Explains offline functionality
 *
 * Components that will go here:
 *   - Icon or illustration
 *   - Reassuring messaging
 *   - Link to /app or home
 *   - Offline status indicator
 */

import Link from "next/link";
import { ROUTES } from "@/constants";

export default function OfflinePage(): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Offline Icon */}
      <div className="mb-6 text-5xl">📡</div>

      {/* Main Content */}
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary-900">You're Offline</h1>
        <p className="text-text-secondary">
          This page hasn't been cached yet, but don't worry—your offline app is
          still available.
        </p>

        {/* What Works Offline */}
        <div className="bg-surface rounded-lg p-4 text-left space-y-2 text-sm">
          <p className="font-semibold text-primary-900">Available Offline:</p>
          <ul className="space-y-1 text-text-secondary">
            <li>✓ Main map and directions</li>
            <li>✓ Emergency contacts</li>
            <li>✓ Lost person report form</li>
            <li>✓ Previous searches</li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-4">
          <Link
            href={ROUTES.APP}
            className="block rounded-lg bg-accent-500 px-6 py-3 font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            Go to Visitor App
          </Link>
          <Link
            href={ROUTES.HOME}
            className="block rounded-lg border-2 border-primary-900 px-6 py-3 font-semibold text-primary-900 hover:bg-primary-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer Note */}
      <p className="absolute bottom-4 text-xs text-text-muted text-center max-w-md">
        Pages are cached automatically as you browse. If you see this, try visiting
        the Visitor App first.
      </p>
    </main>
  );
}
