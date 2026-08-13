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
  const code = searchParams.get("code") ?? "";

  const [pairState, setPairState] = useState<PairState>("loading");
  const [tvName, setTvName] = useState("My TV");
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/pair?code=${code}`);
    }
    if (status === "authenticated") {
      setPairState("pairing");
    }
  }, [status, code, router]);

  async function handlePair() {
    setPairState("loading");
    const res = await fetch("/api/tv/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairing_code: code, tv_name: tvName }),
    });

    if (res.ok) {
      setPairState("success");
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to pair TV");
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
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="size-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">✓</div>
        <h1 className="text-xl font-semibold">TV Paired!</h1>
        <p className="text-neutral-400 text-sm">Redirecting to your dashboard…</p>
      </div>
    );
  }

  if (pairState === "error") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <div className="size-14 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">✗</div>
        <h1 className="text-xl font-semibold">Pairing Failed</h1>
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-white mt-2">
          Go to dashboard →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Pair TV</h1>
        <p className="text-neutral-400 text-sm">
          Pairing code: <span className="font-mono font-bold text-white">{code}</span>
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <label htmlFor="tv-name" className="text-sm text-neutral-400">Give this TV a name</label>
          <input
            id="tv-name"
            type="text"
            value={tvName}
            onChange={(e) => setTvName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
            placeholder="e.g. Front Counter, Dining Room"
          />
        </div>
        <button
          onClick={handlePair}
          className="w-full bg-white text-neutral-950 py-2.5 rounded-lg font-semibold text-sm hover:bg-neutral-200 transition-colors"
        >
          Pair this TV →
        </button>
      </div>
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
