/**
 * Driver Check-in Page (/driver)
 *
 * Purpose:
 *   - Shows vehicle ID
 *   - Shows last check-in location and time
 *   - One large prominent button: "I am here"
 *   - Must be simple enough to use on basic Android phones at bus stops
 *   - Minimal UI, maximum readability
 *
 * Components that will go here:
 *   - DriverCheckin.tsx — the big check-in button
 *   - Current location display
 *   - Last check-in info
 *   - Status indicator
 */

"use client";

import { useState } from "react";
import { logger } from "@/lib/logger";

export default function DriverPage(): JSX.Element {
  const [lastCheckIn, setLastCheckIn] = useState<{
    time: string;
    location: string;
  }>({
    time: "2:45 PM",
    location: "Zone A - Medical Tent",
  });

  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    logger.info("Driver check-in initiated");

    try {
      // Check-in logic will go here
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setLastCheckIn({
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: "Current Location",
      });

      logger.info("Driver check-in successful", { timestamp: new Date() });
    } catch (error) {
      logger.error("Driver check-in failed", error as Error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-primary-900 p-4">
      {/* Header */}
      <div className="text-center py-6 space-y-2">
        <h1 className="text-2xl font-bold text-white">Driver Check-in</h1>
        <p className="text-primary-100">Vehicle SH-001</p>
      </div>

      {/* Status Box */}
      <div className="flex-1 flex flex-col items-center justify-start gap-8 pt-8">
        {/* Vehicle Info */}
        <div className="w-full max-w-sm rounded-lg bg-primary-800 p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-primary-200">Last Check-in</p>
            <p className="text-2xl font-bold text-white">{lastCheckIn.time}</p>
            <p className="text-sm text-primary-100">{lastCheckIn.location}</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Main Check-in Button */}
        <button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className={`w-full max-w-sm rounded-2xl py-8 px-6 font-bold text-2xl text-white transition-all transform ${
            isCheckingIn
              ? "bg-accent-400 scale-95"
              : "bg-accent-500 hover:bg-accent-600 active:scale-95"
          }`}
        >
          {isCheckingIn ? "Checking in..." : "I am here"}
        </button>

        {/* Confirmation Message */}
        {!isCheckingIn && lastCheckIn.time && (
          <div className="text-center text-primary-100 text-sm">
            ✓ Last check-in recorded
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-primary-300 pb-4">
        <p>Check in whenever you reach a stop</p>
        <p>Your location will be recorded automatically</p>
      </div>
    </div>
  );
}
