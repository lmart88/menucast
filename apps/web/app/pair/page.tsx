"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type PairState = "loading" | "pairing" | "success" | "error";

function PairForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const urlCode = searchParams.get("code") ?? "";

  const [pairState, setPairState] = useState<PairState>("loading");
  const [pairingCode, setPairingCode] = useState(urlCode);
  const [tvName, setTvName] = useState("My TV");
  const [error, setError] = useState("");

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
    if (status === "authenticated") {
      setPairState("pairing");
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
    setPairState("loading");
    try {
      const res = await fetch("/api/tv/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairing_code: cleanCode, tv_name: tvName }),
      });

      if (res.ok) {
        setPairState("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to pair TV");
        setPairState("error");
      }
    } catch {
      setError("Network error pairing TV");
      setPairState("error");
    }
  }

  if (pairState === "loading" || status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (pairState === "success") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400">✓</div>
        <h1 className="text-xl font-semibold">TV Paired Successfully!</h1>
        <p className="text-neutral-400 text-sm">Redirecting to your dashboard…</p>
      </div>
    );
  }

  if (pairState === "error") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4 px-4 animate-in fade-in duration-300">
        <div className="size-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-2xl text-red-400">✗</div>
        <h1 className="text-xl font-semibold">Pairing Failed</h1>
        <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>
        <button
          onClick={() => setPairState("pairing")}
          className="mt-2 text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <Link href="/dashboard" className="text-xs text-neutral-500 hover:text-neutral-300">
          Go to dashboard →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-2 max-w-sm">
        <div className="size-3 rounded-full bg-emerald-400 mx-auto mb-3 animate-pulse" />
        <h1 className="text-2xl font-bold tracking-tight">Pair TV Display</h1>
        <p className="text-neutral-400 text-xs leading-relaxed">
          Link a new TV to your account to push and manage live menu designs remotely.
        </p>
      </div>

      <form onSubmit={handlePair} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <label htmlFor="pairing-code" className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Pairing Code
          </label>
          <input
            id="pairing-code"
            type="text"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-center text-lg font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="e.g. PINE-4821"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tv-name" className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Display Name
          </label>
          <input
            id="tv-name"
            type="text"
            value={tvName}
            onChange={(e) => setTvName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
            placeholder="e.g. Front Counter, Dining Room"
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          Connect Display →
        </button>
      </form>
    </div>
  );
}

export default function PairPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="size-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <PairForm />
    </Suspense>
  );
}
