# Sprint Plan & Tracking — MenuCast (miniKast)

**Document Status**: `Active / In Execution`  
**Current Milestone**: `P1: Commercial MVP Launch`  
**Author**: BMad Product Management (`John`) & Scrum Master  
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md)  
**Last Updated**: 2026-08-24  

---

## 🏃 Sprint Overview & Velocity Targets

| Sprint | Theme & Objective | Milestone | Target Duration | Story Points | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sprint 1** | **P0: POC Core Pipeline**<br>Verify and harden end-to-end Figma $\rightarrow$ Supabase $\rightarrow$ TV Display flow. Pairing, crossfades, and Android TV container. | **P0 (POC)** | 1 Week | 21 pts | 🟢 **DONE (100%)** |
| **Sprint 2** | **P1: Public Launchpad (Landing Page & User Accounts)**<br>High-converting marketing homepage, self-serve email/password registration, social OAuth login, and account management. | **P1 (MVP)** | 1.5 Weeks | 24 pts | 🟡 **Active** |
| **Sprint 3** | **P1: Monetization & Extended TV OS Support**<br>Stripe checkout, customer billing portal, screen entitlement gating, and tvOS/Smart TV client packaging. | **P1 (MVP)** | 2 Weeks | 28 pts | ⚪ Planned |

---

## 📊 Sprint 1: POC Core Pipeline (P0) — 🟢 Completed

**Goal**: Deliver a rock-solid MVP where any user can pair a screen in 30 seconds, create matching canvas frames in Figma, push 2x graphics in $<1.5$s with smooth GPU crossfading, and run continuously on Fire TV / Android TV.

| Story ID | Title | Points | Status | Verification |
| :--- | :--- | :--- | :--- | :--- |
| `STORY-1.1` | Dynamic Screen Pairing Handshake & Hardware Telemetry | 3 pts | 🟢 **DONE** | QR code + 8-char code pairing handshake |
| `STORY-1.2` | Display Heartbeat Presence Telemetry | 2 pts | 🟢 **DONE** | 30s background ping & live status badges |
| `STORY-2.1` | Target Display Inspector & Screen Selector in Figma | 2 pts | 🟢 **DONE** | Dynamic screen spec inspection in plugin |
| `STORY-2.2` | 1-Click Canvas Frame Generator Matching Screen Specs | 2 pts | 🟢 **DONE** | Automatic artboard generation matching TV specs |
| `STORY-2.3` | Presigned S3/Supabase Direct Binary Upload Pipeline | 5 pts | 🟢 **DONE** | S3 direct upload bypassing payload limits |
| `STORY-2.4` | Sub-Second 1-Click Push & Broadcast Feedback | 3 pts | 🟢 **DONE** | WebSocket broadcast with `< 1.5s` feedback |
| `STORY-3.1` | Hardware-Accelerated Zero-Flicker Opacity Crossfade | 3 pts | 🟢 **DONE** | Double-buffered smooth crossfading |
| `STORY-3.2` | Local Device State Persistence & Reboot Recovery | 2 pts | 🟢 **DONE** | `localStorage` persistence across reboots |
| `STORY-3.3` | Native Kotlin Android TV / Fire TV Kiosk Container | 1 pt | 🟢 **DONE** | 24/7 wake-lock & boot auto-start |

**Sprint 1 Summary**: 9 Stories | **23 / 23 Story Points Completed (100%)**

---

## 📊 Sprint 2: Public Launchpad (Landing Page & User Accounts) — 🟡 Active

**Goal**: Transform MenuCast into a public-facing SaaS platform with a high-converting landing page and frictionless self-serve authentication.

### Sprint 2 Backlog

| Story ID | Title | Points | Priority | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STORY-4.1` | High-Converting Hero & Interactive Demo Section | 5 pts | P1 | ⚪ To Do | None |
| `STORY-4.2` | Feature Comparison & Compatibility Showcase | 3 pts | P1 | ⚪ To Do | `STORY-4.1` |
| `STORY-4.3` | Pricing Tiers & FAQ Section | 3 pts | P1 | ⚪ To Do | `STORY-4.2` |
| [`STORY-5.1`](file:///Users/battosai/Dev/menucast/docs/stories/story-5.1.md) | Self-Serve Registration, Login & Forgot Password (Redesigned UI) | 5 pts | P1 | 🟢 **DONE** | None |
| `STORY-5.2` | Password Reset & Profile Account Management | 3 pts | P1 | ⚪ To Do | `STORY-5.1` |

*(Note: Social OAuth Login is deferred to Post-MVP in [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md)).*

**Sprint 2 Summary**: 5 Stories | **19 Story Points Total** | **5 / 19 pts Completed (26%)** | 4 To Do.

---

## 📊 Sprint 3: Monetization & Extended TV OS Support (P1) — ⚪ Planned

**Goal**: Implement Stripe payment billing to monetize connected screens, enforce plan limits, and package dedicated clients for Apple TV and Smart TVs.

### Sprint 3 Backlog

| Story ID | Title | Points | Priority | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STORY-6.1` | Apple TV (tvOS) Player Container | 5 pts | P1 | ⚪ To Do | Sprint 1 Completion |
| `STORY-6.2` | Universal Smart TV PWA Optimization (webOS / Tizen) | 5 pts | P1 | ⚪ To Do | Sprint 1 Completion |
| `STORY-7.1` | Stripe Billing Checkout Integration | 8 pts | P1 | ⚪ To Do | `STORY-5.1` |
| `STORY-7.2` | Stripe Customer Portal & Subscription Management | 5 pts | P1 | ⚪ To Do | `STORY-7.1` |
| `STORY-7.3` | Subscription Entitlement & Screen Limit Enforcement | 5 pts | P1 | ⚪ To Do | `STORY-7.1` |

**Sprint 3 Summary**: 5 Stories | **28 Story Points Total** | 0 In Progress | 5 To Do.

---

## 🔍 Definition of Done (DoD) for Stories

A story is considered **DONE** only when:
1. **Acceptance Criteria**: All Given / When / Then criteria in [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) are strictly met.
2. **Type Safety & Build**: Monorepo builds without TypeScript errors (`pnpm build`).
3. **No Regressions**: Existing screen pairing, Figma plugin push, and TV playback remain intact.
4. **Performance Checked**: Display player remains lightweight ($< 120$MB RAM) with sub-second push latency.
5. **Documentation Updated**: PRD, Epics, and Architecture contracts accurately reflect changes.
