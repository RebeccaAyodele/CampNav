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
import Image from "next/image";
import { ROUTES } from "@/constants";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f9f9fc] text-[#1a1c1e]">
      <style>{`
        .campnav-reveal {
          animation: campnav-reveal 900ms ease-out both;
        }

        .campnav-glow {
          box-shadow: 0 0 0 1px rgba(160, 65, 0, 0.18), 0 16px 48px rgba(26, 28, 30, 0.14);
        }

        .campnav-panel {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .campnav-grid {
          background-image: radial-gradient(rgba(160, 65, 0, 0.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        @keyframes campnav-reveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <header className="fixed inset-x-0 top-0 z-50 text-white">
        <div className="mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ff6b00] text-sm font-semibold text-white">
              CN
            </span>
            <span className="text-lg font-semibold tracking-tight">CampNav</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#platform" className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white">
              Platform
            </a>
            <a href="#features" className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white">
              Features
            </a>
            <a href="#footer" className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white">
              Resources
            </a>
            <Link
              href={ROUTES.DASHBOARD_LOGIN}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-white hover:text-[#1a1c1e]"
            >
              Admin Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        {/* Responsive cinematic hero background */}
        <div className="absolute inset-0 z-0">
          <picture>
            <source media="(min-width:1024px)" srcSet="/high-end-cinematic-desktop.png" />
            <source media="(min-width:768px)" srcSet="/high-end-cinematic-tablet.png" />
            <img src="/high-end-cinematic-mobile.png" alt="Cinematic background" className="w-full h-full object-cover" />
          </picture>

          {/* subtle dark gradient over the image */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,28,30,0.88)_0%,rgba(26,28,30,0.6)_45%,rgba(249,249,252,0.06)_100%)]" />

          {/* subtle grid overlay */}
          <div className="absolute inset-0 campnav-grid opacity-30" />
        </div>

        <div className="relative mx-24 grid w-full items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex w-full max-w-3xl flex-col items-start gap-6 text-white campnav-reveal sm:gap-8">
            <div className="space-y-5 sm:space-y-6">
              <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Logistics for the
                <span className="block text-[#ff6b00]">Off-Grid World.</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/82 sm:text-lg sm:leading-8 lg:text-xl">
                Authoritative navigation and resource tracking for large-scale outdoor gatherings where connectivity is a luxury.              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href={ROUTES.APP}
                className="campnav-glow inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#572000] transition-transform hover:-translate-y-0.5 hover:bg-[#ff7a1a] sm:px-7 sm:py-4"
              >
                Open Visitor App
              </Link>
              <Link
                href={ROUTES.DASHBOARD_LOGIN}
                className="inline-flex items-center justify-center rounded-xl border border-white/18 bg-white/6 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-white hover:text-[#1a1c1e] sm:px-7 sm:py-4"
              >
                Admin Login
              </Link>
            </div>
          </div>

          <div className="campnav-reveal pointer-events-none flex min-h-65 items-center justify-center lg:min-h-130">
            <Image
              src="/golden-globe.png"
              alt=""
              width={720}
              height={720}
              priority
              className="h-auto w-full max-w-90 object-contain drop-shadow-[0_28px_80px_rgba(255,107,0,0.32)] sm:max-w-115 lg:max-w-140"
            />
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-[#e2e2e5] bg-[#ffffff] py-24">
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="campnav-reveal rounded-3xl bg-[#f9f9fc] p-8 shadow-[0_20px_60px_rgba(26,28,30,0.06)]">
            <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.04em] text-[#1a1c1e] sm:text-5xl">
              Engineered for silence.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5a4136]">
              CampNav thrives in the void. Our Zero-Bandwidth Reliability protocol ensures your logistical data is always available, even when the grid goes dark.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex gap-4 rounded-2xl border border-[#e2e2e5] bg-[#ffffff] p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffdbcc] text-[#a04100]">01</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1c1e]">Offline-first maps</h3>
                  <p className="mt-1 text-[#5a4136]">Cached map layers and saved routes remain usable without internet access.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl border border-[#e2e2e5] bg-[#ffffff] p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dae2ff] text-[#2559bd]">02</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1c1e]">Coordination console</h3>
                  <p className="mt-1 text-[#5a4136]">Track shuttle movement, staff location, and issue reports from one dashboard.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl border border-[#e2e2e5] bg-[#ffffff] p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#a3f69c] text-[#1b6d24]">03</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a1c1e]">Accessible everywhere</h3>
                  <p className="mt-1 text-[#5a4136]">Visitors can search, request help, and navigate from phones, browsers, or USSD.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-105 items-stretch justify-center overflow-hidden rounded-3xl bg-[#1a1c1e] shadow-2xl lg:ml-8 lg:min-h-0">
            <Image
              src="/button-phone.png"
              alt="Phone showing CampNav controls"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* Large Photography & Feature Grid */}
      <section className="bg-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end md:gap-8 sm:mb-20">
            <div className="max-w-2xl">
              <h2 className="font-headline-lg mb-4 text-4xl font-black text-[#1a1c1e] sm:mb-6 sm:text-5xl">The Intelligence of Infrastructure.</h2>
              <p className="text-[#5a4136]">Deploy custom shuttle tracking, vendor management systems, and real-time hazard mapping without writing a single line of code.</p>
            </div>
            <a className="border-b-2 border-[#a04100] pb-1 text-sm font-black tracking-widest text-[#a04100] hover:text-[#ff6b00]" href="#">VIEW ALL FEATURES</a>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2 group cursor-pointer">
              <div className="relative mb-8 overflow-hidden rounded-3xl aspect-video">
                <Image
                  alt="Dynamic mapping"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  src="/staff-coordination.png"
                  fill
                  sizes="(min-width: 768px) 66vw, 100vw"
                />
                <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 sm:p-10">
                  <span className="text-white font-headline-sm">Precise Topographic Intelligence</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#1a1c1e] sm:text-3xl">Staff Coordination</h3>
                  <p className="text-[#5a4136] mt-2">Manage shuttle routes and incident reporting from a central Command Center.</p>
                </div>
                <span className="text-3xl text-[#ffb693] sm:text-4xl">↗</span>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative mb-8 overflow-hidden rounded-3xl aspect-4/5 bg-[#f3f3f6]">
                <Image
                  alt="Aerial campsite view"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  src="/fleet.png"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a1c1e] sm:text-3xl">Fleet Telemetry</h3>
                <p className="text-[#5a4136] mt-2">Live positioning for all official event vehicles and personnel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1a1c1e] py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 sm:gap-8 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">Ready to deploy</p>
          <h2 className="max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Built for the moments when connectivity is the luxury.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Start with the visitor app or move straight into the admin console for routing, reporting, and emergency operations.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              href={ROUTES.APP}
              className="inline-flex items-center justify-center rounded-full bg-[#ff6b00] px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#572000] transition-transform hover:-translate-y-0.5 hover:bg-[#ff7a1a]"
            >
              Launch Platform
            </Link>
            <Link
              href={ROUTES.DASHBOARD_LOGIN}
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-[#1a1c1e]"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      <footer id="footer" className="border-t border-[#e2e2e5] bg-[#ffffff] py-10 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-[#5a4136] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="font-semibold text-[#1a1c1e]">CampNav</p>
          <p>Offline navigation and logistics for large-scale gatherings.</p>
          <p>© 2026 CampNav. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
