"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { createSupabaseClient } from "@menucast/supabase";

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [tokenHash, setTokenHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [linkExpired, setLinkExpired] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Single persistent client instance
  const client = useMemo(() => {
    if (supabaseUrl && supabaseKey) {
      return createSupabaseClient(supabaseUrl, supabaseKey);
    }
    return null;
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !client) {
      setIsVerifying(false);
      return;
    }

    let isMounted = true;

    // Listen to Supabase auth state transitions (handles PASSWORD_RECOVERY automatically)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
        if (session?.refresh_token) {
          setRefreshToken(session.refresh_token);
        }
        setIsVerifying(false);
      }
    });

    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    // Extract all potential token sources
    const hashAccessToken = hashParams.get("access_token");
    const hashRefreshToken = hashParams.get("refresh_token");
    const queryCode = searchParams.get("code");
    const queryTokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
    const rawToken = searchParams.get("token") || hashAccessToken || "";
    const emailParam = searchParams.get("email") || hashParams.get("email") || "";
    const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Check for explicit error from Supabase redirect
    if (errorDescription || errorCode === "otp_expired") {
      setLinkExpired(true);
      setError(
        errorDescription
          ? decodeURIComponent(errorDescription)
          : "This password reset link is invalid or has expired. Please request a new link."
      );
      setIsVerifying(false);
      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    async function initializeRecoverySession() {
      try {
        // 1. Direct OTP token hash verification (?token_hash=...)
        if (queryTokenHash) {
          setTokenHash(queryTokenHash);
          const { data, error: otpError } = await client!.auth.verifyOtp({
            token_hash: queryTokenHash,
            type: "recovery",
          });

          if (otpError) {
            console.warn("verifyOtp error:", otpError.message);
            // Don't immediately fail if server fallback can verify or if already logged in
            if (otpError.message.toLowerCase().includes("expired") || otpError.message.toLowerCase().includes("invalid")) {
              setLinkExpired(true);
              setError("This password reset link is invalid or has expired. Please request a new link.");
            }
          } else {
            if (data?.user?.email) setEmail(data.user.email);
            if (data?.session?.access_token) setAccessToken(data.session.access_token);
            if (data?.session?.refresh_token) setRefreshToken(data.session.refresh_token);
          }
          if (isMounted) setIsVerifying(false);
          return;
        }

        // 2. PKCE Authorization Code (?code=...)
        if (queryCode) {
          const { data, error: codeError } = await client!.auth.exchangeCodeForSession(queryCode);
          if (codeError) {
            console.warn("exchangeCodeForSession error:", codeError.message);
            setLinkExpired(true);
            setError("This password reset link is invalid or has expired. Please request a new link.");
          } else {
            if (data?.user?.email) setEmail(data.user.email);
            if (data?.session?.access_token) setAccessToken(data.session.access_token);
            if (data?.session?.refresh_token) setRefreshToken(data.session.refresh_token);
          }
          if (isMounted) setIsVerifying(false);
          return;
        }

        // 3. Implicit URL Hash fragment (#access_token=...&refresh_token=...)
        if (hashAccessToken) {
          setAccessToken(hashAccessToken);
          if (hashRefreshToken) {
            setRefreshToken(hashRefreshToken);
            const { data } = await client!.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });
            if (data?.user?.email) setEmail(data.user.email);
          } else {
            const { data } = await client!.auth.getUser(hashAccessToken);
            if (data?.user?.email) setEmail(data.user.email);
          }
          if (isMounted) setIsVerifying(false);
          return;
        }

        // 4. Raw token fallback (?token=...)
        if (rawToken) {
          setAccessToken(rawToken);
          const { data } = await client!.auth.getUser(rawToken);
          if (data?.user?.email) setEmail(data.user.email);
          if (isMounted) setIsVerifying(false);
          return;
        }

        // Check if there is already an active session
        const { data: sessionData } = await client!.auth.getSession();
        if (sessionData?.session) {
          if (sessionData.session.user?.email) setEmail(sessionData.session.user.email);
          if (sessionData.session.access_token) setAccessToken(sessionData.session.access_token);
          if (sessionData.session.refresh_token) setRefreshToken(sessionData.session.refresh_token);
        } else if (!emailParam) {
          // No tokens or session found at all
          setLinkExpired(true);
          setError("No valid password reset token was found in the link. Please request a new link.");
        }
      } catch (err) {
        console.error("Auth recovery initialization error:", err);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    }

    initializeRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, searchParams]);

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
      let updateSucceeded = false;

      // Strategy 1: Update directly via client if active recovery session is established
      if (client) {
        const { error: clientError } = await client.auth.updateUser({ password });
        if (!clientError) {
          updateSucceeded = true;
        }
      }

      // Strategy 2: Server-side fallback with access token or token hash
      if (!updateSucceeded) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            access_token: accessToken || undefined,
            token_hash: tokenHash || undefined,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          updateSucceeded = true;
        } else if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
      }

      if (updateSucceeded) {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => router.push("/login?reset=success"), 2000);
        return;
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
            Create a new password for your account
          </p>
        </div>

        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-xs text-[var(--muted)]">Verifying reset link…</p>
          </div>
        ) : success ? (
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
        ) : linkExpired ? (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 mx-auto flex items-center justify-center font-bold text-sm">
                !
              </div>
              <p className="text-sm text-red-500 font-semibold">
                Reset Link Expired or Invalid
              </p>
              <p className="text-xs text-[var(--muted)]">
                {error || "This password reset link is invalid or has already been used."}
              </p>
            </div>

            <Link
              href="/forgot-password"
              className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              Request New Link
            </Link>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Back to Login
              </Link>
            </div>
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
            {email && (
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="sr-only">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  readOnly
                  value={email}
                  className="w-full h-10 bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--muted)] cursor-not-allowed select-none focus:outline-none"
                />
              </div>
            )}

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
                placeholder="Enter New Password (min 8 chars)"
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
