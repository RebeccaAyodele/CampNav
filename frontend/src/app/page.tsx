"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BatteryFull, Delete, Menu, Phone, RotateCcw, Signal } from "lucide-react";
import { ROUTES } from "@/constants";
import { config } from "@/config";

export default function HomePage() {
  const [dialedDigits, setDialedDigits] = useState("");
  const [screenText, setScreenText] = useState("CampNav GSM Standby\n\nDial *384*4040# to begin.");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionText, setSessionText] = useState<string[]>([]);
  const [ussdReply, setUssdReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isUssdEnd, setIsUssdEnd] = useState(false);

  const handleKeypadPress = (key: string) => {
    if (loading) return;
    if (!sessionActive) {
      setDialedDigits((prev) => prev + key);
    } else {
      if (!isUssdEnd) {
        setUssdReply((prev) => prev + key);
      }
    }
  };

  const handleDialBackspace = () => {
    if (loading) return;
    if (!sessionActive) {
      setDialedDigits((prev) => prev.slice(0, -1));
    } else {
      if (!isUssdEnd) {
        setUssdReply((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleDialEnd = () => {
    setSessionActive(false);
    setSessionText([]);
    setUssdReply("");
    setIsUssdEnd(false);
    setDialedDigits("");
    setScreenText("CampNav GSM Standby\n\nDial *384*4040# to begin.");
  };

  const handleDialCall = async () => {
    if (loading) return;
    if (!sessionActive) {
      if (dialedDigits === "*384*4040#") {
        setLoading(true);
        const sessId = "sim-session-" + Math.floor(Math.random() * 10000000);
        setSessionId(sessId);
        try {
          const res = await fetch(`${config.api.baseUrl}/api/ussd/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessId,
              phoneNumber: "+2348031234567",
              text: ""
            })
          });
          const data = await res.text();
          if (data.startsWith("CON ")) {
            setScreenText(data.substring(4));
            setSessionActive(true);
            setIsUssdEnd(false);
          } else if (data.startsWith("END ")) {
            setScreenText(data.substring(4));
            setSessionActive(true);
            setIsUssdEnd(true);
          } else {
            setScreenText(data);
          }
        } catch (err) {
          setScreenText("Network Error.\nMake sure backend is online.");
        } finally {
          setLoading(false);
        }
      } else {
        setScreenText("Unknown number.\nTry dialing *384*4040#");
        setTimeout(() => {
          setScreenText("CampNav GSM Standby\n\nDial *384*4040# to begin.");
        }, 3000);
      }
    } else {
      handleUssdSend();
    }
  };

  const handleUssdSend = async () => {
    if (loading || isUssdEnd) return;
    if (!ussdReply.trim()) return;

    setLoading(true);
    const nextSessionText = [...sessionText, ussdReply];
    setSessionText(nextSessionText);
    const accumulatedText = nextSessionText.join("*");
    setUssdReply("");

    try {
      const res = await fetch(`${config.api.baseUrl}/api/ussd/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          phoneNumber: "+2348031234567",
          text: accumulatedText
        })
      });
      const data = await res.text();
      if (data.startsWith("CON ")) {
        setScreenText(data.substring(4));
        setIsUssdEnd(false);
      } else if (data.startsWith("END ")) {
        setScreenText(data.substring(4));
        setIsUssdEnd(true);
      } else {
        setScreenText(data);
      }
    } catch (err) {
      setScreenText("Network Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f9f9fc] text-[#1a1c1e]">
      {/* Redirect immediately if launched in PWA standalone/app mode */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
              window.location.href = '/app';
            }
          `,
        }}
      />
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

        .campnav-mobile-menu > summary {
          list-style: none;
        }

        .campnav-mobile-menu > summary::-webkit-details-marker {
          display: none;
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

          <details className="campnav-mobile-menu relative md:hidden">
            <summary
              aria-label="Open navigation menu"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/[0.15] bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </summary>

            <div className="absolute right-0 top-14 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/[0.15] bg-[#1a1c1e]/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur">
              <nav className="flex flex-col gap-1">
                <a href="#platform" className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  Platform
                </a>
                <a href="#features" className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  Features
                </a>
                <a href="#footer" className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  Resources
                </a>
                <Link
                  href={ROUTES.DASHBOARD_LOGIN}
                  className="mt-2 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1c1e] transition-colors hover:bg-[#ff6b00] hover:text-[#572000]"
                >
                  Admin Login
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </header>

      <section className="relative flex min-h-svh items-center overflow-hidden pt-20 lg:min-h-screen">
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
          <div className="absolute inset-0 campnav-grid opacity-10" />
        </div>

        <div className="relative grid w-full items-center gap-6 px-4 py-8 sm:px-6 sm:py-16 lg:mx-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-20">
          <div className="flex w-full max-w-3xl flex-col items-start gap-5 text-white campnav-reveal sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="max-w-4xl text-5xl font-black tracking-[-0.02em] sm:text-6xl sm:tracking-[-0.04em] lg:text-7xl">
                Logistics for the
                <span className="block text-[#ff6b00]">Off-Grid World.</span>
              </h1>
              <p className="max-w-2xl leading-6 text-white/82 sm:text-lg sm:leading-8 lg:text-xl">
                Authoritative navigation and resource tracking for large-scale outdoor gatherings where connectivity is a luxury.              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href={ROUTES.APP}
                className="campnav-glow inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#572000] transition-transform hover:-translate-y-0.5 hover:bg-[#ff7a1a] sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.18em]"
              >
                Open Visitor App
              </Link>
              <Link
                href={ROUTES.DASHBOARD_LOGIN}
                className="inline-flex items-center justify-center rounded-xl border border-white/[0.18] bg-white/[0.06] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-white hover:text-[#1a1c1e] sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.18em]"
              >
                Admin Login
              </Link>
            </div>
          </div>

          <div className="campnav-reveal pointer-events-none flex min-h-52 items-center justify-center sm:min-h-[16.25rem] lg:min-h-0">
            <Image
              src="/golden-globe.png"
              alt=""
              width={720}
              height={720}
              priority
              className="h-auto w-full max-w-72 object-contain drop-shadow-[0_28px_80px_rgba(255,107,0,0.32)] sm:max-w-[28.75rem] lg:max-w-none"
            />
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-[#e2e2e5] bg-[#ffffff] py-24">
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="campnav-reveal rounded-3xl bg-[#f9f9fc] md:p-8 p-4 shadow-[0_20px_60px_rgba(26,28,30,0.06)]">
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

          {/* Retro Nokia USSD Phone Simulator Widget */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl lg:ml-8 min-h-[550px] relative overflow-hidden select-none">
            <div className="absolute top-3 left-3 bg-orange-600/10 border border-orange-500/25 px-3 py-1 rounded-full text-[10px] font-black text-orange-400 tracking-wider z-10 animate-pulse">
              INTERACTIVE USSD SIMULATOR
            </div>
            
            {/* Nokia Phone Frame */}
            <div className="w-[260px] bg-slate-800 border-8 border-slate-950 rounded-[40px] shadow-2xl p-4 flex flex-col items-center gap-4 relative">
              {/* Ear Speaker */}
              <div className="w-12 h-1.5 bg-slate-950 rounded-full mb-1" />
              
              {/* LCD Screen Container */}
              <div className="w-full bg-[#b9c8a1] text-[#1c2e17] font-mono border-4 border-slate-700 rounded-lg p-2.5 h-[190px] flex flex-col justify-between shadow-inner relative text-[11px] leading-tight select-none">
                {/* Header signal/battery */}
                <div className="flex justify-between items-center text-[9px] border-b border-[#1c2e17]/25 pb-1 uppercase font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Signal className="h-2.5 w-2.5" aria-hidden="true" />
                    RCCG Link
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BatteryFull className="h-2.5 w-2.5" aria-hidden="true" />
                    100%
                  </span>
                </div>
                
                {/* Screen Content */}
                <div className="flex-1 my-2 overflow-y-auto whitespace-pre-wrap pr-0.5 text-left font-bold text-[10px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-xs animate-pulse">
                      Sending...
                    </div>
                  ) : (
                    screenText
                  )}
                </div>

                {/* Dialed digits overlay / active input */}
                <div className="border-t border-[#1c2e17]/25 pt-1 flex flex-col gap-1 shrink-0">
                  {!sessionActive ? (
                    <div className="text-right text-xs font-black tracking-widest text-[#1c2e17] truncate h-4">
                      {dialedDigits || " "}
                    </div>
                  ) : (
                    !isUssdEnd && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUssdSend();
                        }}
                        className="flex gap-1"
                      >
                        <input
                          type="text"
                          value={ussdReply}
                          onChange={(e) => setUssdReply(e.target.value)}
                          className="flex-1 bg-[#a5b48e] border-b border-[#1c2e17] text-[#1c2e17] font-mono text-xs px-1 focus:outline-none placeholder-[#1c2e17]/30"
                          placeholder="Reply..."
                          disabled={loading}
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-[#1c2e17] text-[#b9c8a1] px-2 py-0.5 text-[9px] font-black rounded active:scale-95"
                        >
                          SEND
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>

              {/* Nokia Keyboard Grid */}
              <div className="w-full flex flex-col gap-3">
                {/* Navigation Keys */}
                <div className="grid grid-cols-3 gap-2 text-center text-slate-400 font-bold text-[10px]">
                  {/* Left select (Send/Select) */}
                  <button
                    onClick={sessionActive ? handleUssdSend : handleDialCall}
                    className="py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-700 text-white rounded-lg font-bold border border-slate-600 active:scale-95 transition-all"
                  >
                    SELECT
                  </button>
                  {/* Menu / Nav arrow */}
                  <div className="flex flex-col items-center justify-center text-[10px] text-slate-500 font-black">
                    ▲▼
                  </div>
                  {/* Right select (Clear) */}
                  <button
                    onClick={handleDialBackspace}
                    className="py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-700 text-white rounded-lg font-bold border border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-0.5"
                  >
                    <Delete className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Call / End Keys */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Green Call button */}
                  <button
                    onClick={handleDialCall}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl border border-emerald-500 shadow-md font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Phone className="h-3 w-3 fill-white" />
                    <span>CALL</span>
                  </button>
                  {/* Red End button */}
                  <button
                    onClick={handleDialEnd}
                    className="py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl border border-rose-500 shadow-md font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>END</span>
                  </button>
                </div>

                {/* Numeric Grid Keys */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "1", label: "1" }, { key: "2", label: "2 ABC" }, { key: "3", label: "3 DEF" },
                    { key: "4", label: "4 GHI" }, { key: "5", label: "5 JKL" }, { key: "6", label: "6 MNO" },
                    { key: "7", label: "7 PQRS" }, { key: "8", label: "8 TUV" }, { key: "9", label: "9 WXYZ" },
                    { key: "*", label: "*" }, { key: "0", label: "0" }, { key: "#", label: "#" }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => handleKeypadPress(btn.key)}
                      className="py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white border border-slate-600/40 rounded-xl shadow active:scale-95 transition-all flex flex-col items-center justify-center"
                    >
                      <span className="text-xs font-bold leading-none">{btn.key}</span>
                      <span className="text-[6px] text-slate-400 font-semibold tracking-wide uppercase leading-none mt-0.5">{btn.label.includes(" ") ? btn.label.split(" ")[1] : ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 sm:p-10">
                  <span className="text-white font-headline-sm">Precise Topographic Intelligence</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[#1a1c1e] sm:text-3xl">Staff Coordination</h3>
                  <p className="text-[#5a4136] mt-2">Manage shuttle routes and incident reporting from a central Command Center.</p>
                </div>
                <ArrowUpRight className="h-9 w-9 shrink-0 text-[#ffb693] sm:h-10 sm:w-10" aria-hidden="true" />
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative mb-8 aspect-[4/5] overflow-hidden rounded-3xl bg-[#f3f3f6]">
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
              className="inline-flex items-center justify-center rounded-xl bg-[#ff6b00] px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#572000] transition-transform hover:-translate-y-0.5 hover:bg-[#ff7a1a]"
            >
              Launch Platform
            </Link>
            <Link
              href={ROUTES.DASHBOARD_LOGIN}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-[#1a1c1e]"
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
