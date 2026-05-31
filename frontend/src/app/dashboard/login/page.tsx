/**
 * Admin Login Page (/dashboard/login)
 *
 * Purpose:
 *   - Email and password login form
 *   - No self-registration
 *   - Submit button
 *   - Error/success messaging
 *
 * Components that will go here:
 *   - Email input
 *   - Password input
 *   - Submit button
 *   - Error message display
 *   - Loading state
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage(): JSX.Element {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Login logic will go here
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Login attempt:", formData);
      // Redirect to dashboard on success
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-6 shadow-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900">CampNav Admin</h1>
          <p className="mt-2 text-sm text-text-secondary">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-error-light p-3 text-sm text-error-dark">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-900 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-900 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-900 px-6 py-3 font-semibold text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-border pt-4 text-center text-sm text-text-secondary">
          <Link
            href={ROUTES.HOME}
            className="text-accent-500 hover:text-accent-600 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
