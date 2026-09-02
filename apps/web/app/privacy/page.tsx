import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — miniKast",
  description: "Privacy Policy for miniKast and the miniKast Android TV player application.",
};

export default function PrivacyPage() {
  return (
    <main className="home-shell min-h-screen">
      <div className="home-noise" aria-hidden="true" />

      {/* Navigation Header */}
      <header className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 pt-6 sm:pt-8 flex justify-between items-center z-10">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <img
            src="/logo-minikast.svg"
            alt="miniKast Logo"
            className="w-10 h-10 transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            miniKast
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <section className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 py-8 sm:py-12 z-10">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-10 shadow-sm transition-colors duration-300">
          <div className="border-b border-[var(--line)] pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Last updated: September 2, 2026 • Effective Date: September 2, 2026
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-[var(--foreground)] space-y-8 text-sm sm:text-base leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                1. Overview & Commitment
              </h2>
              <p className="text-[var(--muted)]">
                Welcome to <strong>miniKast</strong> (&quot;miniKast&quot;, &quot;MenuCast&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
                miniKast provides digital menu board signage solutions allowing restaurants and businesses to design, manage, and push digital menus to physical display screens, web clients, and TV applications (including the <strong>miniKast TV</strong> Android TV player).
              </p>
              <p className="text-[var(--muted)] mt-2">
                We are committed to protecting your privacy and being transparent about how data is collected, used, and secured across our web platform and Android TV application.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                2. Information We Collect
              </h2>
              <div className="space-y-3 text-[var(--muted)]">
                <p>
                  <strong>A. TV Display Player & Hardware Telemetry (Android TV App):</strong><br />
                  The miniKast Android TV kiosk application operates strictly as a display client. It collects non-personal technical telemetry necessary to synchronize menu displays:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Pairing Identifiers:</strong> Ephemeral 8-character pairing codes and assigned screen IDs.</li>
                  <li><strong>Display Heartbeat & Connection State:</strong> Ping timestamps to report whether a screen is online/offline.</li>
                  <li><strong>Screen Specifications:</strong> Resolution (e.g. 1920×1080) and orientation (landscape/portrait) to render menu graphics accurately.</li>
                </ul>
                <p className="italic text-xs text-[var(--muted)] mt-1">
                  * Note: The Android TV app does NOT collect location, audio, camera/microphone data, personal contact information, or financial details.
                </p>

                <p className="pt-2">
                  <strong>B. Account & Web Dashboard Information:</strong><br />
                  When you register an account on the miniKast web portal or Figma plugin:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Account Credentials:</strong> Email address and encrypted password credentials.</li>
                  <li><strong>Uploaded Menu Assets:</strong> Menu images, graphics, and artboards pushed to your connected displays.</li>
                  <li><strong>Session Tokens:</strong> Secure API authentication tokens and session cookies.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                3. How We Use Information
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[var(--muted)]">
                <li>To authenticate your account and securely manage your paired TV screens.</li>
                <li>To broadcast real-time menu updates from Figma or the web dashboard to your TV displays via encrypted WebSockets.</li>
                <li>To provide live screen status and diagnostic telemetry on your dashboard.</li>
                <li>To maintain system reliability, security, and prevent abuse.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                4. Data Storage, Security & Retention
              </h2>
              <p className="text-[var(--muted)]">
                All network communication between your TV display, web dashboard, and server uses industry-standard <strong>HTTPS / TLS encryption</strong>. Database records are protected with strict PostgreSQL Row-Level Security (RLS) policies to ensure complete tenant isolation.
              </p>
              <p className="text-[var(--muted)] mt-2">
                We retain account data and paired display configurations for as long as your account remains active. You can unpair screens or delete your account at any time from the account settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                5. Third-Party Services
              </h2>
              <p className="text-[var(--muted)]">
                We partner with reputable infrastructure providers to operate the service:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[var(--muted)] mt-2">
                <li><strong>Supabase:</strong> Database hosting, user authentication, storage, and real-time WebSocket infrastructure.</li>
                <li><strong>Vercel:</strong> Web application hosting and serverless API execution.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                6. Children&apos;s Privacy
              </h2>
              <p className="text-[var(--muted)]">
                miniKast is a business digital signage platform and is not directed to children under 13 years of age. We do not knowingly collect personal data from children.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                7. Contact Us
              </h2>
              <p className="text-[var(--muted)]">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <p className="mt-2 text-[var(--muted)]">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:hello@menucast.com"
                  className="text-[var(--foreground)] font-bold hover:underline"
                >
                  hello@menucast.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="w-full bg-[var(--surface)] border-t border-[var(--line)] z-10 mt-auto transition-colors duration-300">
        <footer className="w-full max-w-[806px] mx-auto px-4 sm:px-8 md:px-16 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--muted)]">
          <span>© 2026 MenuCast (miniKast). All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors font-bold text-[var(--foreground)]">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
