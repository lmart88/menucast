"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

function PairForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const urlCode = searchParams.get("code") ?? "";

  const [pairingCode, setPairingCode] = useState(urlCode);
  const [tvName, setTvName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync urlCode if changed
  useEffect(() => {
    if (urlCode) {
      setPairingCode(urlCode);
    }
  }, [urlCode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      const redirectUrl = pairingCode ? `/pair?code=${encodeURIComponent(pairingCode)}` : "/pair";
      router.push(`/login?callbackUrl=${encodeURIComponent(redirectUrl)}`);
    }
  }, [status, pairingCode, router]);

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = pairingCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a valid pairing code");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tv/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairing_code: cleanCode, tv_name: tvName.trim() || "My TV" }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to pair TV");
      }
    } catch {
      setError("Network error pairing TV");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="home-shell min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="home-noise" aria-hidden="true" />
        <div className="size-8 border-2 border-[#008996] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <main className="home-shell min-h-screen flex flex-col items-center justify-center p-4 relative bg-[var(--background)] text-[var(--foreground)]">
        <div className="home-noise" aria-hidden="true" />
        <div className="w-full max-w-[320px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-[16px] p-6 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="size-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-500 font-bold">
            ✓
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#0d1f21] dark:text-[#f4f8f7]">TV Paired Successfully!</h1>
            <p className="text-xs text-[#547a7c] dark:text-[#a3b7b5]">Redirecting to your dashboard…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="home-shell min-h-screen flex flex-col items-center justify-center p-4 relative bg-[var(--background)] text-[var(--foreground)] select-none">
      <div className="home-noise" aria-hidden="true" />

      <div className="flex flex-col items-center gap-4 w-full max-w-[320px] animate-in fade-in zoom-in-95 duration-400">
        {/* Centered Brand Logo (Figma node 1459:10831) */}
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image
            src="/menucast-logo.svg"
            alt="miniKast Logo"
            width={146}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Card Container (Figma node 1459:10832) */}
        <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-[16px] p-6 shadow-[0_1px_4px_rgba(12,12,13,0.05)] flex flex-col gap-6 items-start">
          {/* Card Title & Subtitle */}
          <div className="flex flex-col gap-2 items-center text-center w-full">
            <h1 className="text-[20px] font-bold text-[#0d1f21] dark:text-[#f4f8f7] leading-tight">
              Pair New TV
            </h1>
            <p className="text-[14px] font-normal text-[#547a7c] dark:text-[#a3b7b5] leading-relaxed">
              Link a new TV to your account to push and manage live menu designs remotely.
            </p>
          </div>

          <form onSubmit={handlePair} className="flex flex-col gap-4 items-start w-full">
            {/* Confirm Code Pill / Input (Figma node 1459:10893) */}
            {urlCode ? (
              <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-[16px] px-4 py-2 flex items-center justify-between shadow-2xs">
                <span className="text-[14px] font-normal text-[#547a7c] dark:text-[#a3b7b5]">
                  Confirm Code
                </span>
                <span className="text-[20px] font-bold text-[#008996] font-mono tracking-wide">
                  {pairingCode.includes("-") ? pairingCode.replace("-", " -") : pairingCode}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 items-start w-full">
                <label
                  htmlFor="pairing-code"
                  className="text-[14px] font-normal text-[var(--foreground)]"
                >
                  Pairing Code
                </label>
                <input
                  id="pairing-code"
                  type="text"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  className="w-full h-[40px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 py-2 text-[16px] font-mono font-bold text-[#008996] uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#008996]/30"
                  placeholder="e.g. BARK-2874"
                  required
                />
              </div>
            )}

            {/* TV Name Input Field (Figma node 1459:10885) */}
            <div className="flex flex-col gap-2 items-start w-full">
              <label
                htmlFor="tv-name"
                className="text-[14px] font-normal text-[var(--foreground)]"
              >
                TV Name
              </label>
              <input
                id="tv-name"
                type="text"
                value={tvName}
                onChange={(e) => setTvName(e.target.value)}
                className="w-full h-[40px] bg-[var(--surface)] border border-[var(--accent-soft)] rounded-lg px-4 py-2 text-[14px] text-[var(--foreground)] placeholder-[#547a7c] focus:outline-none focus:ring-2 focus:ring-[#008996]/30"
                placeholder="Enter TV Name"
              />
            </div>

            {error && (
              <div className="w-full p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {/* CTA Button (Figma node 1459:10841) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[40px] bg-[#f27200] hover:bg-[#ff8000] text-white font-bold rounded-full text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs mt-2"
            >
              {isSubmitting && (
                <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSubmitting ? "Connecting Display…" : "Pair TV"}</span>
            </button>
          </form>
        </div>

        {/* Subtle Back link */}
        <Link
          href="/dashboard"
          className="text-xs text-[#547a7c] dark:text-[#a3b7b5] hover:text-[var(--foreground)] transition-colors"
        >
          ← Return to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default function PairPage() {
  return (
    <Suspense
      fallback={
        <div className="home-shell min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="home-noise" aria-hidden="true" />
          <div className="size-8 border-2 border-[#008996] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PairForm />
    </Suspense>
  );
}
