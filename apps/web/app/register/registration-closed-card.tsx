import Link from "next/link";

export function RegistrationClosedCard() {
  return (
    <div className="w-full max-w-[380px] flex flex-col items-baseline gap-4">
      {/* Centered Logo */}
      <div className="w-16 h-12 flex items-center justify-center -mb-6 z-10">
        <img src="/logo-minikast.svg" alt="miniKast" className="w-100 h-auto" />
      </div>

      {/* Floating Card */}
      <div className="w-full bg-[var(--surface)] border border-[var(--accent-soft)] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 transition-colors duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)]/40 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
            <span>Private Preview</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
            Registration Closed
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            miniKast is currently in private testing. Public account registration is temporarily disabled.
          </p>
        </div>

        <div className="bg-[var(--surface-soft)] border border-[var(--accent-soft)] rounded-xl p-4 text-xs text-[var(--muted)] text-center">
          Already have an authorized account or tester access?
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full h-10 bg-[#f27200] hover:bg-[#d96600] text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
