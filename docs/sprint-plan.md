# Sprint Plan & Tracking — MenuCast (miniKast)

**Document Status**: `Active / In Execution`  
**Current Sprint**: `Sprint 1: POC Hardening & Core Pipeline Validation`  
**Author**: BMad Product Management (`John`) & Scrum Master  
**Cross-References**: [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md)  
**Last Updated**: 2026-08-20  

---

## 🏃 Sprint Overview & Velocity Targets

| Sprint | Theme & Objective | Target Duration | Story Points | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 1** | **POC Hardening & Core Pipeline Validation**<br>Verify and harden the end-to-end Figma $\rightarrow$ Supabase $\rightarrow$ TV Display flow. Ensure pairing, crossfades, and Android TV container are bulletproof. | 1 Week | 21 pts | 🟢 **Active** |
| **Sprint 2** | **Multi-Screen Fleet Management & Offline Resilience**<br>Screen grouping, fleet dashboard with live status badges, remote screen actions, and offline Service Worker caching. | 1.5 Weeks | 26 pts | ⚪ Planned |
| **Sprint 3** | **Daypart Scheduling & Live Price Overlays (V1.0)**<br>Automated daypart transitions (Breakfast/Lunch/Dinner), timed slide loops, and instant dashboard price modifications. | 2 Weeks | 32 pts | ⚪ Planned |

---

## 📊 Sprint 1: POC Hardening & Core Pipeline Validation

**Goal**: Deliver a rock-solid MVP where any user can pair a screen in 30 seconds, create matching canvas frames in Figma, push 2x graphics in $<1.5$s with smooth GPU crossfading, and run continuously on Fire TV / Android TV.

### Sprint 1 Backlog & Status

| Story ID | Title | Points | Assignee | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STORY-1.1` | Dynamic Screen Pairing Handshake & Telemetry | 3 pts | Developer | 🟢 **DONE (Verified)** | None |
| `STORY-2.1` | Target Display Inspector & Screen Selector in Figma | 2 pts | Developer | 🟢 **DONE (Verified)** | `STORY-1.1` |
| `STORY-2.2` | 1-Click Canvas Frame Generator Matching Screen Specs | 2 pts | Developer | 🟢 **DONE (Verified)** | `STORY-2.1` |
| `STORY-2.3` | Presigned S3/Supabase Direct Binary Upload Pipeline | 5 pts | Developer | 🟢 **DONE (Verified)** | `STORY-2.2` |
| `STORY-2.4` | Sub-Second 1-Click Push & Broadcast Feedback | 3 pts | Developer | 🟢 **DONE (Verified)** | `STORY-2.3` |
| `STORY-3.1` | Hardware-Accelerated Zero-Flicker Opacity Crossfade | 3 pts | Developer | 🟢 **DONE (Verified)** | `STORY-2.4` |
| `STORY-3.2` | Local Device State Persistence & Reboot Recovery | 2 pts | Developer | 🟢 **DONE (Verified)** | `STORY-1.1` |
| `STORY-3.4` | Native Kotlin Android TV / Fire TV Kiosk Container | 1 pt | Developer | 🟢 **DONE (Verified)** | `STORY-3.1` |

**Sprint 1 Summary**: 8 Stories | **21 / 21 Story Points Completed (100%)** | 🟢 **Sprint 1 Complete!**

---

## 📊 Sprint 2: Multi-Screen Fleet Management & Offline Resilience

**Goal**: Enable multi-location and multi-screen operators to manage fleets of displays with groups, live heartbeat status, remote commands, and offline cache resilience.

### Sprint 2 Backlog & Status

| Story ID | Title | Points | Priority | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STORY-1.2` | Multi-Screen Grouping & Tagging Schema & APIs | 5 pts | P0 | ⚪ To Do | Sprint 1 Completion |
| `STORY-1.3` | Fleet Management Dashboard UI & Heartbeat Badges | 8 pts | P0 | ⚪ To Do | `STORY-1.2` |
| `STORY-1.4` | Remote Screen Actions (Reload, Clear Screen, Unpair) | 5 pts | P1 | ⚪ To Do | `STORY-1.3` |
| `STORY-3.3` | Service Worker & CacheStorage Offline Playback | 8 pts | P0 | ⚪ To Do | Sprint 1 Completion |

**Sprint 2 Summary**: 4 Stories | **26 Story Points Total** | 0 In Progress | 4 To Do.

---

## 📊 Sprint 3: Daypart Scheduling & Live Price Overlays (V1.0)

**Goal**: Deliver commercial automation with scheduled menu dayparting, timed slide carousels, and instant dashboard text/price modifications.

### Sprint 3 Backlog & Status

| Story ID | Title | Points | Priority | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `STORY-4.1` | Playlist & Schedule Schema & Backend APIs | 8 pts | P1 | ⚪ To Do | `STORY-1.2` |
| `STORY-4.2` | Automated Dayparting & Timed Carousel Engine | 8 pts | P1 | ⚪ To Do | `STORY-4.1`, `STORY-3.1` |
| `STORY-5.1` | Figma Layer Tagging (`#price`) & Metadata Export | 8 pts | P1 | ⚪ To Do | Sprint 1 Completion |
| `STORY-5.2` | Dashboard Live Quick Price & "Sold Out" Modifier | 8 pts | P1 | ⚪ To Do | `STORY-5.1` |

**Sprint 3 Summary**: 4 Stories | **32 Story Points Total** | 0 In Progress | 4 To Do.

---

## 🔍 Definition of Done (DoD) for Stories

A story is considered **DONE** only when:
1. **Acceptance Criteria**: All Given / When / Then criteria in [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) are strictly met.
2. **Type Safety & Build**: Monorepo builds without TypeScript errors (`pnpm build`).
3. **No Regressions**: Existing pairing, Figma export, and display playback continue working seamlessly.
4. **Performance Checked**: Display player remains fluid (60fps crossfade, $<120$MB RAM usage).
5. **Documentation Updated**: Changes to schema, APIs, or contracts reflected in `docs/architecture.md` and `project-context.md`.
