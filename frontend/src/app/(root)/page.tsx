/**
 * Landing Page (/)
 *
 * Purpose:
 *   - First page users see
 *   - Explains what CampNav is
 *   - Two main CTAs: "Open Visitor App" and "Admin Login"
 *
 * Components that will go here:
 *   - Hero section with app description
 *   - Feature highlights
 *   - Two prominent CTA buttons
 *   - Footer with links
 */

import Link from "next/link";
import { ROUTES } from "@/constants";

export default function HomePage(): JSX.Element {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <h1 className="text-2xl font-bold text-primary-900">CampNav</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-primary-900 sm:text-5xl">
            Navigate Offline. Coordinate Everywhere.
          </h2>
          <p className="mt-6 text-lg text-text-secondary">
            CampNav is an offline-first navigation and logistics coordination system
            for large-scale gatherings. Works without internet. Accessible on any device.
          </p>

          {/* Feature Highlights */}
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-primary-900">Works Offline</p>
              <p className="text-sm text-text-secondary">
                No internet required. All maps and data cached locally.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-primary-900">Coordination</p>
              <p className="text-sm text-text-secondary">
                Track shuttles, manage lost person reports, optimize routes.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-primary-900">Accessible</p>
              <p className="text-sm text-text-secondary">
                Works on feature phones via USSD, smartphones, and browsers.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href={ROUTES.APP}
              className="rounded-lg bg-accent-500 px-8 py-3 font-semibold text-white hover:bg-accent-600 transition-colors"
            >
              Open Visitor App
            </Link>
            <Link
              href={ROUTES.DASHBOARD_LOGIN}
              className="rounded-lg border-2 border-primary-900 px-8 py-3 font-semibold text-primary-900 hover:bg-primary-50 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="container mx-auto px-4 text-center text-sm text-text-secondary">
          <p>&copy; 2026 CampNav. Offline navigation for everyone.</p>
        </div>
      </footer>
    </main>
  );
}
