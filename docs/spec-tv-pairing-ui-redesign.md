---
title: 'TV Display Pairing Screen UI Redesign'
type: 'feature'
created: '2026-08-28'
status: 'approved'
figma_node: '1459:10382'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1459-10382'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current `/tv` pairing screen uses an unstyled dark-mode prototype with individual letter boxes, heavy borders, and dark glow effects that do not reflect the clean, cohesive miniKast visual identity (light mint radial backdrop, teal `#008996` accent borders, tilted brand bird icon, and clean typography).

**Approach:** Redesign the `/tv` pairing state to match the approved Figma design (`node-id=1459:10382`):
1. **Atmosphere**: Light cyan/mint radial backdrop (`#f7fcfc` to `#b7eaed`) with subtle dot pattern grid.
2. **Branded QR Code Card**:
   - High-contrast QR code container (`bg-white`, `border-4 border-[#008996]`, `20px` border-radius).
   - miniKast bird logo icon playfully perched on the top-left corner of the QR code card, rotated at `33.52deg`.
   - Countdown timer below the QR code: "Refreshes in MM:SS" in `#547a7c`.
3. **Screen Setup Instructions & Pairing Code**:
   - Section label: "Screen Setup" (`16px bold #547a7c`).
   - Main Heading: "Pair this Display" (`32px bold #0d1f21`).
   - Description: "Scan the QR code with your phone or visit the link below to link this display to your miniKast account." (`16px regular #547a7c`).
   - Unified Pairing Code Pill: Floating white card (`bg-white`, `border 1px solid #b7eaed`, `16px` border-radius) displaying "Pairing Code" on the left (`#547a7c`) and the 8-character code formatted as `"WORD -1234"` on the right in bold `#008996` (`20px`).
   - Subtle manual link URL fallback for keyboard/remote entry.
4. **Preserved Capabilities**: Fullscreen toggle, auto-refresh watchdog, Supabase Realtime channel subscription `pairing:<CODE>`, and smooth transition to paired / displaying states.

## Boundaries & Constraints

**Always:**
- Keep Next.js App Router (`apps/web/app/tv/page.tsx`) with React 19, Tailwind CSS, and `QRCodeSVG`.
- Ensure responsive centering across 1080p, 4K, 720p, landscape, and portrait TV orientations.
- Ensure the QR code remains high error-correction level (`level="H"`) and scannable from 6–10 feet away.
- Maintain existing Supabase Realtime pairing channel handshake and telemetry reporting (`screen_width`, `screen_height`, `aspect_ratio`, `orientation`).

**Never:**
- Alter backend pairing API contracts (`/api/tv/init`, `/api/tv/pair`, `/api/tv/screen-info`, `/api/tv/status`).
- Break 24/7 display playback, crossfading, or offline caching.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **INIT_PAIRING_SCREEN** | TV client launches `/tv` with no stored pairing | Renders redesigned pairing screen with dynamic QR code, perched bird icon, countdown timer, and pairing code pill | Auto-retries on network drop |
| **CODE_EXPIRATION** | Countdown timer hits 00:00 | Automatically calls `initTv(true)` to generate fresh code and smoothly updates QR code | Seamless inline refresh |
| **QR_CODE_SCAN** | User scans QR code with mobile phone | Navigates to `{appUrl}/pair?code=<CODE>` on mobile device | Direct link provided as text fallback |
| **PAIRING_COMPLETED** | User submits code on web dashboard / mobile | TV receives `tv:paired` over Supabase Realtime, saves to `localStorage`, and transitions to paired/displaying state | Automatic reconnect watchdog |

</frozen-after-approval>

## Code Map

- `apps/web/app/tv/page.tsx` — TV display player and pairing screen component.
- `apps/web/app/globals.css` — Global styling and atmospheric background tokens.
- `apps/web/public/logo-minikast.svg` — miniKast bird mascot asset.

## Acceptance Criteria

1. **Visual Accuracy**: Pairing state matches Figma node `1459:10382` on both 1080p and 4K TV displays.
2. **Perched Mascot**: miniKast bird logo is rendered at the top-left of the QR code card with `33.52deg` tilt.
3. **QR Code Styling**: White QR container framed with `4px solid #008996` border and `20px` border radius.
4. **Pairing Code Card**: Single horizontal pill (`border 1px solid #b7eaed`, `rounded-2xl`) with "Pairing Code" label and bold teal code.
5. **Real-time Pairing Handshake**: Scanning or entering the code completes pairing and transitions display without interruption.
