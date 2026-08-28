"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "../components/auth-shell";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Automatically sign in the user
      const loginResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // If automatic login fails, redirect to login page with success hint
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] flex flex-col items-center gap-4">
      {/* Centered Logo */}
      <div className="w-12 h-12 flex items-center justify-center mb-1">
        <img src="/logo-minikast.svg" alt="miniKast" className="w-10 h-10" />
      </div>

      {/* Floating Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 transition-colors duration-300">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
            Create Account
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
            <label htmlFor="register-email" className="sr-only">
              Email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="sr-only">
              Create Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create Password"
              className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-confirm-password" className="sr-only">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full h-10 bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? "Creating Account…" : "Create Account"}
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
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[380px]">
            <div className="w-8 h-8 border-2 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
