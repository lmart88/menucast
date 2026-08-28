"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
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
            Sign In
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Welcome back to your dashboard
          </p>
        </div>

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
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? "Signing in…" : "Login"}
            </button>

            <Link
              href="/register"
              className="w-full h-10 bg-transparent border border-[var(--accent-soft)] hover:bg-[var(--surface-soft)] text-[var(--foreground)] font-medium text-sm rounded-lg transition-all flex items-center justify-center"
            >
              Create Account
            </Link>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[360px]">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
