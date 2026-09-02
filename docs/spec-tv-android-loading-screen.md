---
title: 'Android TV App Connecting & Loading Screen UI Redesign'
type: 'feature'
created: '2026-09-01'
status: 'approved'
figma_node: '1510:2556'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1510-2556'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/architecture.md'
  - '{project-root}/docs/spec-tv-pairing-ui-redesign.md'
  - '{project-root}/docs/spec-tv-paired-idle-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The initial loading/connecting screen in the native Android TV / Fire TV kiosk application (`apps/tv-android`) used a legacy dark layout with a standard green Android `ProgressBar` and generic text ("miniKast TV Player / Starting display player..."). This lacked brand polish, felt like a prototype, and clashed with the approved miniKast design system.

**Approach:** Redesign the Android TV loading and connecting screen to strictly align with Figma design frame `1510:2556` ("Android Loading Screen"):
1. **Atmosphere**: Deep slate/teal background (`#091516`) with a subtle radial vignette glow (`#1F3132` center glow) to eliminate harsh white glare during TV cold boots.
2. **Brand Lockup (`node-id=1510:2560`)**:
   - Prominent miniKast bird mascot icon (teal body `#008996`, wing accent `#015860`, orange beak `#FF8400`, white eye).
   - Clean white "miniKast" wordmark positioned alongside the mascot.
3. **Dynamic Connecting Status (`node-id=1510:2578`)**:
   - Status text: `"Connecting to miniKast.com...."` (or dynamic host when configured with custom server URLs).
   - Typography: Nunito font stack (`40px` base scale on 1080p, `#B7EAED` tertiary mint color).
   - Subtle animated pulsing indicator to communicate active network handshake.
4. **Smooth Alpha Crossfade**:
   - 300ms alpha crossfade when the WebView finishes loading `/tv` to prevent black-screen pop-in or frame tearing.

## Boundaries & Constraints

**Always:**
- Keep hardware acceleration (`LAYER_TYPE_HARDWARE`) and 24/7 screen wake-lock (`FLAG_KEEP_SCREEN_ON`).
- Preserve safe-area overscan padding (`48dp` / `5%` minimum) for TV bezels.
- Dynamically parse the target host from the server URL (e.g. `miniKast.com` or local network IP).
- Maintain auto-retry watchdog (`ConnectivityManager.NetworkCallback`) and remote control key handlers (`KEYCODE_MENU`, `KEYCODE_R`).

**Never:**
- Break WebView local caching (`LOAD_DEFAULT`), mixed-content permissions, or remote web contents debugging.
- Add blocking synchronous main-thread network calls.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **APP_COLD_BOOT** | TV device boots up or app launches | Displays dark slate background with miniKast logo lockup and "Connecting to {host}…" | Stays visible while WebView warms up |
| **CUSTOM_SERVER_URL** | User configured custom server URL | Displays "Connecting to {customHost}…" | Graceful URL host parsing |
| **PAGE_LOAD_SUCCESS** | WebView `onPageFinished()` fires | Smooth 300ms fade-out of loading overlay revealing the live TV player | Auto-cleans animation state |
| **CONNECTION_DROPOUT** | Network timeout or unreachable host | Transitions to branded `#errorOverlay` with 5s auto-retry countdown | Auto-reconnects when network restores |
| **REMOTE_SETTINGS** | User presses Menu key on remote | Opens Server URL settings dialog over the screen | Restarts load on save |

</frozen-after-approval>

## Code Map

- `apps/tv-android/app/src/main/res/layout/activity_main.xml` — Layout definition for `#loadingOverlay` and `#errorOverlay`.
- `apps/tv-android/app/src/main/res/drawable/bg_tv_radial.xml` — Atmospheric radial backdrop drawable.
- `apps/tv-android/app/src/main/res/drawable/ic_minikast_logo.xml` — Vector drawable for mascot + wordmark brand lockup.
- `apps/tv-android/app/src/main/res/values/colors.xml` — Color tokens (`#091516`, `#1F3132`, `#008996`, `#B7EAED`, `#FF8400`).
- `apps/tv-android/app/src/main/res/values/strings.xml` — UI strings and status formatting templates.
- `apps/tv-android/app/src/main/java/app/minikast/tv/MainActivity.kt` — Connecting host resolver and alpha crossfade logic.

## Acceptance Criteria

1. **Visual Accuracy (`node-id=1510:2556`)**: The loading screen precisely matches Figma frame `1510:2556` (dark slate background, brand lockup, and mint `#B7EAED` status copy).
2. **Dynamic Host Resolution**: Displays `"Connecting to miniKast.com…"` for production URLs and `"Connecting to {host}…"` for custom/local IPs.
3. **Smooth Dismissal**: Loading overlay fades out with a 300ms transition with zero flicker.
4. **Error & Watchdog Resilience**: Network errors cleanly surface the retry overlay and automatically re-attempt connection.
