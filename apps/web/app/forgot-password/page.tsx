"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [directLink, setDirectLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirect_to: redirectUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link. Please try again.");
        setLoading(false);
        return;
      }

      if (data.direct_link) {
        setDirectLink(data.direct_link);
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] flex flex-col items-baseline gap-4">
      {/* Centered Logo */}
      <div className="w-16 h-12 flex items-center justify-center -mb-6 z-10">
        <img src="/logo-minikast.svg" alt="miniKast" className="w-100 h-auto" />
      </div>

      {/* Floating Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 transition-colors duration-300">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {submitted
              ? "Check your inbox for instructions"
              : "Give us your email to find your account"}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-xl p-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <p className="text-sm text-[var(--foreground)] font-medium">
                Reset link sent!
              </p>
              <p className="text-xs text-[var(--muted)]">
                If an account exists for <span className="font-semibold">{email}</span>, you will receive an email with instructions to reset your password.
              </p>
            </div>

            {/* Direct testing button (if link returned during dev/testing) */}
            {directLink && (
              <a
                href={directLink}
                className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] hover:bg-[var(--surface-soft)] text-[var(--accent)] font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡ Open Reset Link Directly (Dev Mode)</span>
              </a>
            )}

            <Link
              href="/login"
              className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm text-red-500 font-medium"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="sr-only">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? "Submitting…" : "Submit"}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
