/**
 * Emergency Contacts Page (/app/emergency)
 *
 * Purpose:
 *   - Static page showing emergency service numbers
 *   - Medical, Security, Fire response numbers in large text
 *   - Must load instantly offline
 *   - One-tap calling capability
 *
 * Components that will go here:
 *   - Emergency service cards with phone numbers
 *   - One-click call buttons
 *   - Emergency alert button (for critical situations)
 */

"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";

interface EmergencyService {
  id: string;
  name: string;
  type: string;
  phoneNumber: string;
  icon: string;
  description: string;
}

export default function EmergencyPage(): JSX.Element {
  const emergencyServices: EmergencyService[] = [
    {
      id: "1",
      name: "Medical",
      type: "Health & First Aid",
      phoneNumber: "+1-555-0100",
      icon: "🚑",
      description: "Emergency medical response",
    },
    {
      id: "2",
      name: "Security",
      type: "Safety & Security",
      phoneNumber: "+1-555-0200",
      icon: "👮",
      description: "Security and assistance",
    },
    {
      id: "3",
      name: "Fire",
      type: "Fire & Rescue",
      phoneNumber: "+1-555-0300",
      icon: "🚒",
      description: "Fire response and rescue",
    },
  ];

  const handleCall = (phoneNumber: string) => {
    // Open phone dialer
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-border p-3 shadow-sm">
        <div className="container mx-auto flex items-center gap-2">
          <Link
            href={ROUTES.APP}
            className="text-primary-900 hover:text-primary-700 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-primary-900">Emergency Contacts</h1>
        </div>
      </div>

      {/* Emergency Services Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="container mx-auto space-y-4">
          {emergencyServices.map((service) => (
            <div
              key={service.id}
              className="rounded-lg border-2 border-error-base bg-white p-4 space-y-3"
            >
              {/* Service Icon and Name */}
              <div className="flex items-start gap-3">
                <div className="text-4xl">{service.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-error-base">{service.name}</h2>
                  <p className="text-sm text-text-secondary">{service.type}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-text-secondary">{service.description}</p>

              {/* Phone Number - Large and Prominent */}
              <div className="bg-error-light rounded-lg p-4 text-center">
                <p className="text-xs text-text-muted mb-1">Call directly:</p>
                <p className="text-2xl font-bold text-error-base font-mono">
                  {service.phoneNumber}
                </p>
              </div>

              {/* Call Button */}
              <button
                type="button"
                onClick={() => handleCall(service.phoneNumber)}
                className="w-full rounded-lg bg-error-base px-6 py-3 font-semibold text-white hover:bg-error-dark transition-colors text-lg"
              >
                📞 Call {service.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Alert Button */}
      <div className="border-t border-error-base bg-error-light p-4">
        <button
          type="button"
          className="w-full rounded-lg bg-error-base px-6 py-3 font-bold text-white hover:bg-error-dark transition-colors text-lg animate-pulse"
        >
          🚨 Emergency Alert
        </button>
        <p className="text-xs text-error-dark text-center mt-2">
          Send your location to all emergency services immediately
        </p>
      </div>
    </div>
  );
}
