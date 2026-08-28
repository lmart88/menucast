"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { createSupabaseClient } from "@menucast/supabase";

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [tokenHash, setTokenHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      const token = hashParams.get("access_token") || searchParams.get("token") || searchParams.get("code") || "";
      const tHash = searchParams.get("token_hash") || hashParams.get("token_hash") || "";
      const emailParam = searchParams.get("email") || hashParams.get("email") || "";
      
      if (token) setAccessToken(token);
      if (tHash) setTokenHash(tHash);
      if (emailParam) setEmail(decodeURIComponent(emailParam));

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const client = createSupabaseClient(supabaseUrl, supabaseKey);

        // If token_hash is available, verify OTP to establish recovery session
        if (tHash) {
          client.auth.verifyOtp({ token_hash: tHash, type: "recovery" }).then(({ data, error: otpError }) => {
            if (data?.user?.email) {
              setEmail(data.user.email);
            }
            if (data?.session?.access_token) {
              setAccessToken(data.session.access_token);
            }
            if (otpError) {
              console.warn("verifyOtp warning:", otpError.message);
            }
          });
        } else if (token) {
          client.auth.getUser(token).then(({ data }) => {
            if (data?.user?.email) {
              setEmail(data.user.email);
            }
          }).catch(() => {});
        }
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const client = createSupabaseClient(supabaseUrl, supabaseKey);

        // If token_hash was present, verify it if not already verified
        if (tokenHash) {
          await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        } else if (accessToken) {
          await client.auth.setSession({ access_token: accessToken, refresh_token: accessToken });
        }

        const { error: clientError } = await client.auth.updateUser({ password });
        if (!clientError) {
          setSuccess(true);
          setLoading(false);
          setTimeout(() => router.push("/login?reset=success"), 2000);
          return;
        }
      }

      // Fallback: try server endpoint with accessToken
      if (accessToken) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            access_token: accessToken,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setLoading(false);
          setTimeout(() => router.push("/login?reset=success"), 2000);
          return;
        }
      }

      setError("Failed to reset password. The link may have expired. Please request a new link.");
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
            Password Reset
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Welcome back to your dashboard
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-xl p-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <p className="text-sm text-[var(--foreground)] font-medium">
                Password updated successfully!
              </p>
              <p className="text-xs text-[var(--muted)]">
                Redirecting you to the sign in page...
              </p>
            </div>

            <Link
              href="/login"
              className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              Sign In Now
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

            {/* Email Input (Readonly / Pre-populated) */}
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="sr-only">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                readOnly
                value={email || "johndoe@outlook.com"}
                className="w-full h-10 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--muted)] cursor-not-allowed select-none focus:outline-none"
              />
            </div>

            {/* Enter New Password */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="sr-only">
                Enter New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter New Password"
                className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-new-password" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? "Updating Password…" : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[360px]">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
