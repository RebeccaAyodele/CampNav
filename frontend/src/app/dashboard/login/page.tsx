/**
 * Admin Login Page (/dashboard/login)
 * Performs real auth against POST /api/auth/login, sets JWT, and redirects to dashboard.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Shield, Mail, Lock, RefreshCw, AlertCircle, ArrowLeft } from "lucide-react";
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
        // Redirect to dashboard layout
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
    <div className="flex min-h-screen items-center justify-center bg-[#071133] p-4 text-white">
      {/* Background decoration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-[#0D1B4B]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-blue-400 mb-2">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
            CampNav Portal
          </h1>
          <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
            {t("signInSubtitle")}
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-sm animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@campnav.local"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400 font-semibold"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400 font-semibold"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>{t("signingIn")}</span>
              </>
            ) : (
              <span>{t("signIn")}</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-4 border-t border-white/5 text-center">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all hover:gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
