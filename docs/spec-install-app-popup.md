---
title: 'PWA Install App Popup & Download Modal Redesign'
type: 'feature'
created: '2026-08-28'
status: 'approved'
figma_node: '1470:9050'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1470-9050'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current PWA install banner and installation prompt in `apps/web/app/pwa-install-prompt.tsx` uses a legacy dark-mode styling with generic text, dark background, and an incongruous button layout that does not match the clean mint/cyan design system. Additionally, clicking "Install App" in the dashboard header falls back to an unstyled browser `alert()`.

**Approach:** Redesign the PWA Install Popup and Download Modal to strictly adhere to Figma node `1470:9050` ("Install PopUp"):
1. **Container**: Floating card (`bg-[var(--surface, #f7fcfc)]`, `border 1px solid #b7eaed`, `16px` border-radius, soft depth shadow `0 4px 12px rgba(12, 12, 13, 0.08)`).
2. **Branded Mascot App Icon**:
   - Square container (`48px` x `48px`) with rounded corners (`8px`).
   - miniKast bird mascot logo (`/logo-minikast.svg`).
3. **Typography**:
   - Title: "Install miniKast App" (Nunito Bold, `14px`, text color `#0d1f21` / `var(--foreground)`).
   - Subtitle: "Launch directly from your device." (Nunito Regular, `14px`, text color `#547a7c` / `var(--muted)`).
4. **Action Button**:
   - Primary Pill Button: Solid brand teal (`#008996` / `var(--accent)`), white bold text, height `36px`, rounded-full, with download tray icon.
5. **Dismissal & Trigger Integration**:
   - Subtle dismiss close button (`✕`) for easy user dismissal.
   - Triggers native `beforeinstallprompt` on Chromium/Android/Desktop, or opens guided iOS "Add to Home Screen" instructions on Safari.
   - Unified with dashboard and header "Install App" triggers.

## Boundaries & Constraints

**Always:**
- Keep Next.js App Router (`apps/web/app/pwa-install-prompt.tsx`) with React 19 and Tailwind CSS.
- Match tokens from Figma node `1470:9050` (background `#f7fcfc`, border `#b7eaed`, accent `#008996`, text `#0d1f21` / `#547a7c`).
- Preserve cooldown dismissal (`localStorage` key with 7-day expiry).
- Maintain responsive positioning: bottom-right on desktop/tablet, bottom-center full-width toast on mobile.

**Never:**
- Interfere with native PWA lifecycle (`standalone` mode detection, service worker registration).
- Use native `alert()` when "Install App" is clicked.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **PWA_CAN_INSTALL** | `beforeinstallprompt` fired or iOS Safari detected | Renders redesigned Install Popup matching Figma node `1470:9050` | Suppressed if standalone or recently dismissed |
| **USER_CLICKS_INSTALL** | User clicks "Install" on Chrome/Edge/Android | Calls `deferredPrompt.prompt()` and handles choice outcome | Clears prompt on accept |
| **USER_ON_IOS** | User clicks "Install" on iOS Safari | Displays step-by-step visual sheet ("Share" -> "Add to Home Screen" -> "Add") with brand styling | Dismissible via "Got it" |
| **HEADER_INSTALL_CLICK** | User clicks "Install App" in dashboard/tv header | Opens the Install Popup / Modal directly | Graceful fallback instructions if browser does not support PWA |
| **USER_DISMISSES** | User clicks "✕" | Dismisses popup and sets 7-day cooldown in `localStorage` | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/app/pwa-install-prompt.tsx` — Client PWA install prompt banner and iOS guide modal.
- `apps/web/app/dashboard/dashboard-client.tsx` — Dashboard header "Install App" action integration.
- `apps/web/app/layout.tsx` — Global root layout embedding `<PwaInstallPrompt />`.

## Acceptance Criteria

1. **Visual Accuracy**: Install Popup matches Figma node `1470:9050` with `#f7fcfc` background, `#b7eaed` border, bird icon, and `#008996` pill button.
2. **PWA Handshake**: Successfully prompts browser PWA install on supported platforms.
3. **iOS Instructions**: Clean iOS Safari installation instructions with updated visual tokens.
4. **Header Integration**: Dashboard "Install App" triggers the install flow smoothly without generic alerts.
