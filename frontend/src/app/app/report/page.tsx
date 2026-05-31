/**
 * Lost Person Report Form (/app/report)
 *
 * Purpose:
 *   - Form for reporting lost persons
 *   - Fields: description, age, last known location, contact number
 *   - Offline-capable, queues submission if no connectivity
 *   - Submit button to send report
 *
 * Components that will go here:
 *   - Form inputs (text, select, map picker)
 *   - Geolocation button for last known location
 *   - Offline queue indicator
 *   - Success/error message handling
 */

"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";
import { useState } from "react";

interface FormData {
  description: string;
  age: string;
  location: string;
  contactNumber: string;
}

export default function ReportPage(): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    description: "",
    age: "",
    location: "",
    contactNumber: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will go here
    console.log("Form data:", formData);
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
          <h1 className="text-lg font-semibold text-primary-900">Report Lost Person</h1>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="container mx-auto p-4 max-w-md space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary-900 mb-1">
              Name or Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., John, 5'10\", blue shirt"
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              rows={3}
              required
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-primary-900 mb-1">
              Approximate Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 35"
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* Last Known Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-primary-900 mb-1">
              Last Known Location
            </label>
            <div className="flex gap-2">
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Near medical tent"
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                type="button"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary-900 hover:bg-white transition-colors"
              >
                📍
              </button>
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-primary-900 mb-1">
              Your Contact Number *
            </label>
            <input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="e.g., +1234567890"
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
            />
          </div>

          {/* Offline Notice */}
          <div className="bg-info-light rounded-lg p-3 text-xs text-info-dark">
            💾 This report will be saved locally and sent when you're online.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-accent-500 px-6 py-3 font-semibold text-white hover:bg-accent-600 transition-colors"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}
