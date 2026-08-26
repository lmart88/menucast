import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <span className="text-xl font-semibold tracking-tight">miniKast</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm bg-white text-neutral-950 px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 gap-8">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-neutral-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Digital menus, live on your TV
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.05]">
          Your menu.
          <br />
          <span className="text-neutral-500">Any TV. Instantly.</span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-xl leading-relaxed">
          Design your restaurant menu in Figma, publish it to your TV in one click.
          No hardware. No tech skills. Just beautiful menus your guests will love.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/tv"
            className="bg-white text-neutral-950 px-6 py-3 rounded-xl font-semibold text-base hover:bg-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Pair Your TV →
          </Link>
          <Link
            href="/login"
            className="border border-white/10 text-white px-6 py-3 rounded-xl font-medium text-base hover:bg-white/5 transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-white/5 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {[
          { icon: "📱", title: "Scan to pair", desc: "Open on your TV, scan the QR code with your phone. Done in 30 seconds." },
          { icon: "🎨", title: "Push your design", desc: "Upload your design or push it from Figma to your TV screen." },
          { icon: "⚡️", title: "Instant updates", desc: "Push a new menu and your TV updates in real-time. No refresh needed." },
        ].map((f) => (
          <div key={f.title} className="px-8 py-10 flex flex-col gap-3">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
