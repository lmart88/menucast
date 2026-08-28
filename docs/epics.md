# Epics & User Stories Breakdown — MenuCast (miniKast)

**Document Status**: `Approved / In Execution`  
**Version**: `2.0.0`  
**Author**: BMad Product Management (`John`) & Lead Architect (`Winston`)  
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md) | [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md)  
**Last Updated**: 2026-08-24  

---

## 📋 Backlog Overview

| Epic ID | Epic Name | Priority | Milestone | Status | Stories |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EPIC-1** | Screen Pairing & Telemetry | P0 | POC | 🟢 Completed | 2 Stories |
| **EPIC-2** | Image Upload & Figma Plugin (Image Only) | P0 | POC | 🟢 Completed | 4 Stories |
| **EPIC-3** | TV Display Engine (PWA & Android TV) | P0 | POC | 🟢 Completed | 3 Stories |
| **EPIC-4** | Marketing Landing Page (`/`) | P1 | MVP | ⚪ Planned | 3 Stories |
| **EPIC-5** | Self-Serve User Accounts & Auth | P1 | MVP | ⚪ Planned | 2 Stories |
| **EPIC-6** | Extended TV OS Support (tvOS / Smart TV) | P1 | MVP | ⚪ Planned | 2 Stories |
| **EPIC-7** | Stripe Subscriptions & Billing Gating | P1 | MVP | ⚪ Planned | 3 Stories |

*(Note: Social OAuth Login, Video upload, History, Transitions, Schedule, Multi-screen Fleet Management, Synchronization, and Live Menu HTML/CSS Overlays are parked in [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md)).*

---

## 🎯 P0: Proof of Concept (POC) — Completed & Verified

### EPIC-1: Screen Pairing & Telemetry

#### STORY-1.1: Dynamic Screen Pairing Handshake & Hardware Telemetry
- [x] **Given** an unconfigured TV opening `/tv`, **When** the page loads, **Then** it generates an 8-character pairing code (`WORD-1234`), renders a QR code pointing to `/pair?code=<CODE>`, and subscribes to Supabase Realtime channel `pairing:<CODE>`.
- [x] **Given** an authenticated user submitting the code at `/pair` or `/dashboard`, **When** `POST /api/tv/pair` executes, **Then** the TV record is created/updated in Postgres, and a `tv:paired` broadcast event is fired over `pairing:<CODE>`.
- [x] **Given** the TV client receives `tv:paired`, **When** processing the event, **Then** it saves `{ tv_id, name }` in `localStorage`, switches to `displaying`/`paired` state, and posts its physical resolution, aspect ratio, and orientation to `POST /api/tv/screen-info`.

#### STORY-1.2: Display Heartbeat Presence Telemetry
- [x] **Given** an active TV running `/tv`, **When** the player is open, **Then** it sends a background heartbeat ping (`POST /api/tv/heartbeat`) every 30 seconds, updating `tvs.last_seen_at`.
- [x] **Given** the dashboard on `/dashboard`, **When** displaying screen cards, **Then** screens with `last_seen_at` within 60 seconds show a pulsing green `● Online` badge; otherwise `○ Offline`.

#### STORY-1.3: TV Display Pairing Screen UI Redesign (`node-id=1459:10382`)
- [x] **Given** an unconfigured TV or visitor loading `/tv`, **When** the pairing state is active, **Then** it renders the updated design matching Figma node `1459:10382` with light mint radial atmosphere, high-contrast QR code container framed with `4px solid #008996`, tilted perched bird icon, and countdown refresh timer.
- [x] **Given** the pairing screen, **When** displaying the code, **Then** it renders the floating pairing code card (`border 1px solid #b7eaed`, `rounded-2xl`) with "Pairing Code" label and bold `#008996` code.
- [x] **Given** a user scanning the QR code or submitting the code, **When** the pairing event is received, **Then** the TV transitions smoothly to the paired/displaying state.

---

### EPIC-2: Image Upload & Figma Plugin (Image Only)

#### STORY-2.1: Target Display Inspector & Screen Selector in Figma
- [x] **Given** the plugin UI open and authenticated with an API Token, **When** loaded, **Then** it queries `GET /api/tv/list` and populates the screen selection dropdown with TV names and aspect ratios.
- [x] **Given** a selected TV in the dropdown, **When** selected, **Then** a specs card displays its exact resolution (e.g. `1920 × 1080`), aspect ratio (`16:9`), and orientation (`Landscape`).

#### STORY-2.2: 1-Click Canvas Frame Generator Matching Screen Specs
- [x] **Given** a selected TV with resolution `W × H`, **When** clicking "Create Frame on Canvas", **Then** the plugin sandbox creates a frame on the active page with width `W`, height `H`, dark background fill (`#141414`), and names it `"<TV Name> Menu (W×H)"`.

#### STORY-2.3: Presigned S3/Supabase Direct Binary Upload Pipeline
- [x] **Given** a frame export initiated in the plugin, **When** the sandbox exports 2x PNG bytes, **Then** the UI thread calls `POST /api/menu/upload` with Bearer auth to receive `{ upload_url, public_url }`.
- [x] **Given** the presigned `upload_url`, **When** the UI thread executes a direct HTTP `PUT` with binary bytes, **Then** the image is saved to Supabase Storage `menus` bucket with `200 OK`.

#### STORY-2.4: Sub-Second 1-Click Push & Broadcast Feedback
- [x] **Given** a completed binary upload, **When** the plugin calls `POST /api/menu/push`, **Then** the server records the push in `menus`, updates `tvs.current_menu_url`, and broadcasts `menu:push` over `tv:<TV_ID>`.
- [x] **Given** the broadcast is sent, **When** the response returns $< 1.5$s, **Then** the plugin UI displays a success banner: `"✓ Pushed successfully to TV!"` and re-enables action buttons.

---

### EPIC-3: TV Display Engine (PWA & Android TV)

#### STORY-3.1: Zero-Flicker Hardware-Accelerated Opacity Crossfade
- [x] **Given** a TV currently displaying Menu A, **When** a `menu:push` event delivers Menu B, **Then** Menu B is preloaded in an off-screen node and transitions over Menu A using an 800ms cubic-bezier opacity crossfade with zero black frame flickers.

#### STORY-3.2: Local Device State Persistence & Power-Cycle Recovery
- [x] **Given** a TV that was successfully paired, **When** the device reboots or refreshes, **Then** it reads stored `{ tv_id, current_menu_url }` from `localStorage` and launches straight into displaying the menu.

#### STORY-3.3: Native Kotlin Android TV / Fire TV Kiosk Container
- [x] **Given** a Fire TV / Android TV device booting up, **When** `ACTION_BOOT_COMPLETED` is received, **Then** `BootReceiver` starts `MainActivity` automatically with `FLAG_KEEP_SCREEN_ON` and auto-reconnect watchdog.

#### STORY-3.4: PWA Install App Popup & Download Modal Redesign (`node-id=1470:9050`)
- [x] **Given** an uninstalled visitor or dashboard user on supported browsers, **When** the install prompt is triggered, **Then** it displays the floating card matching Figma node `1470:9050` with bird mascot icon, "Install miniKast App" / "Launch directly from your device." copy, and `#008996` pill button.
- [x] **Given** a user clicking "Install", **When** on Chromium/Android/Desktop, **Then** the native browser PWA installation handshake executes smoothly.
- [x] **Given** a user clicking "Install App" in dashboard/tv headers or on iOS Safari, **When** native PWA prompt is unsupported, **Then** an updated branded modal instructions sheet is displayed.

---

## 🚀 P1: Commercial MVP — Active Backlog

### EPIC-4: Marketing Landing Page (`/`)

#### STORY-4.1: High-Converting Hero & Interactive Demo Section
- [ ] **Given** a visitor navigating to `/`, **When** the landing page loads, **Then** it presents a punchy value proposition (*"Turn any TV into a live digital menu board directly from Figma in 30 seconds"*), an animated product walkthrough, and primary "Get Started Free" CTA.

#### STORY-4.2: Feature Comparison & Compatibility Showcase
- [ ] **Given** the landing page, **When** scrolling, **Then** it showcases a side-by-side comparison (MenuCast vs. Traditional USB/Clunky Signage CMS) and hardware compatibility pills ($25 Fire TV Stick, Chromecast, Smart TVs).

#### STORY-4.3: Pricing Tiers & FAQ Section
- [ ] **Given** the landing page, **When** viewing pricing, **Then** it renders interactive Free vs. Pro tier cards with monthly/annual billing toggles and an interactive FAQ accordion.

---

### EPIC-5: Self-Serve User Accounts & Auth

#### STORY-5.1: Self-Serve Registration & Email Authentication (Redesigned UI)
- [ ] **Given** a visitor navigating to `/register` or `/login`, **When** the page loads, **Then** it renders the updated authentication layout matching Figma node `1456:9252` (mint radial gradient backdrop, miniKast logo, floating rounded card container `#FFFFFF` with `#b7eaed` border).
- [ ] **Given** a new user on `/register`, **When** submitting email, password, and confirm password, **Then** inputs are validated, account credentials are encrypted and stored in PostgreSQL, and user is redirected to `/dashboard`.
- [ ] **Given** an existing user on `/login`, **When** entering email and password, **Then** credentials are authenticated via NextAuth credentials provider, session is created, and user is redirected to `/dashboard` (or `callbackUrl`).
- [ ] **Given** an invalid password, unregistered email, or network failure, **When** submitting auth forms, **Then** inline contextual error messages are displayed with clear visual hierarchy.

#### STORY-5.2: Password Reset & Profile Account Management
- [ ] **Given** an existing user, **When** requesting password reset at `/forgot-password`, **Then** a secure one-time reset link is dispatched, allowing the user to reset their credentials securely.
- [ ] **Given** an authenticated user on `/dashboard/settings` or account modal, **When** updating their profile, **Then** name/email/password changes are persisted securely.

#### STORY-5.3: Dashboard Displays & Screen Management UI Redesign (`node-id=1468:7181`)
- [x] **Given** an authenticated user on `/dashboard`, **When** the page loads, **Then** it renders the updated design matching Figma node `1468:7181` with brand header (miniKast logo, Install App, Account, Sign Out, theme switch), light mint radial backdrop with dot pattern, and brand footer.
- [x] **Given** a user with paired screens, **When** viewing the "Displays" section, **Then** screen cards are rendered with live thumbnail/placeholder, top-left status pill badge, screen title, delete icon button, and hardware specifications (`resolution`, `aspect ratio`, `orientation`).
- [x] **Given** a user clicking "Pair New Screen", **When** clicked, **Then** the user is directed to the screen pairing workflow (`/pair`).
- [x] **Given** a user clicking the delete icon on a screen card, **When** confirmed, **Then** `DELETE /api/tv/delete` executes and removes the screen from Postgres and realtime subscriptions.

*(Note: Social OAuth Login is deferred to [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md)).*

---

### EPIC-6: Extended TV OS Support

#### STORY-6.1: Apple TV (tvOS) Player Container
- [ ] **Given** an Apple TV device running tvOS, **When** opening the MenuCast tvOS app, **Then** it renders the fullscreen display player, supports pairing handshake, and prevents tvOS aerial screensavers while active.

#### STORY-6.2: Universal Smart TV PWA Optimization (LG webOS & Samsung Tizen)
- [ ] **Given** a smart TV browser on LG webOS or Samsung Tizen, **When** loading `/tv`, **Then** navigation keys and remote D-Pad controls are mapped for fullscreen kiosk mode with low-memory optimizations.

---

### EPIC-7: Stripe Subscriptions & Billing Gating

#### STORY-7.1: Stripe Billing Checkout Integration
- [ ] **Given** a user on the Free plan wishing to add more than 1 screen, **When** selecting a Pro subscription in `/dashboard/billing`, **Then** Stripe Checkout initiates and provisions active subscription status upon `checkout.session.completed` webhook.

#### STORY-7.2: Stripe Customer Portal & Subscription Management
- [ ] **Given** an active subscriber, **When** clicking "Manage Subscription" in `/dashboard`, **Then** they are redirected to Stripe Customer Portal to update card details, change plans, or cancel.

#### STORY-7.3: Subscription Entitlement & Screen Limit Enforcement
- [ ] **Given** a user on a 1-screen Free plan, **When** attempting to pair a 2nd screen, **Then** the pairing API checks active entitlements and prompts an upgrade modal if screen limits are reached.
