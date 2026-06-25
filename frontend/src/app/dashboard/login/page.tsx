/**
 * Admin Login Page (/dashboard/login)
 * Performs real auth against POST /api/auth/login, sets JWT, and redirects to dashboard.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Mail, Lock, RefreshCw, AlertCircle, ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data?: { token: string; user: any };
        error?: { message: string };
      }>("/api/auth/login", { email, password });

      if (response.success && response.data) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("adminUser", JSON.stringify(response.data.user));
        window.location.href = "/dashboard";
      } else {
        setError(response.error?.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-shell flex min-h-screen items-start justify-center p-4 pt-3 sm:items-center sm:pt-4">
      <div className="relative w-full max-w-[330px] space-y-5">
        <div className="text-center space-y-3">
          <div className="inline-flex h-[53px] w-[51px] items-center justify-center bg-[var(--dashboard-accent)] text-[var(--dashboard-text)]">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-wide text-[var(--dashboard-accent-dark)]">
            CampNav
          </h1>
          <p className="dash-label text-[var(--dashboard-text)]">
            {t("signInSubtitle")}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 border border-[var(--dashboard-alert)] bg-[color-mix(in_srgb,var(--dashboard-alert)_8%,white)] px-4 py-3 text-sm text-[var(--dashboard-alert)]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="dash-panel space-y-4 p-3.5">
          <div className="flex items-center gap-2 border-b dash-divider pb-3">
            <Lock className="h-5 w-5 text-[var(--dashboard-accent-dark)]" />
            <h2 className="text-lg font-extrabold">Admin Authentication</h2>
          </div>

          <div>
            <label className="dash-label mb-2 block">Operator Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--dashboard-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@event-org.com"
                className="dash-field pl-10 pr-4 py-2.5 text-sm font-semibold"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="dash-label mb-2 block">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--dashboard-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="dash-field pl-10 pr-4 py-2.5 text-sm font-semibold"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-2 text-[var(--dashboard-muted)]">
              <span className="h-3.5 w-3.5 border border-[var(--dashboard-border)] bg-[var(--dashboard-panel)]" />
              Keep Session Active
            </span>
            <span className="font-bold text-[var(--dashboard-info)]">Reset Key</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="dash-button-primary flex w-full items-center justify-center gap-3 py-3.5 text-sm uppercase tracking-wide disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>{t("signingIn")}</span>
              </>
            ) : (
              <>
                <span>Initialize Login</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex items-center gap-2 border border-[var(--dashboard-border)] bg-[color-mix(in_srgb,var(--dashboard-alert)_5%,white)] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[var(--dashboard-alert)]">
            <AlertCircle className="h-3.5 w-3.5" />
            Public Registration Disabled
          </div>
          <p className="mx-auto max-w-[260px] text-sm leading-relaxed text-[var(--dashboard-accent-dark)]">
            Unauthorized access attempts are logged. Contact your logistics coordinator for credentials.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--dashboard-accent-dark)] transition-all hover:text-[var(--dashboard-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
