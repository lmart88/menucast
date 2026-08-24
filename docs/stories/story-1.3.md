# Story Specification: STORY-1.3 — Fleet Management Dashboard UI & Heartbeat Indicators

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-1.3`  
**Epic**: [`EPIC-1: Screen Pairing & Fleet Management`](file:///Users/battosai/Dev/menucast/docs/epics.md#L59-L73)  
**Sprint**: [`Sprint 2: Multi-Screen Fleet Management & Offline Resilience`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L42-L57)  
**Story Points**: `8 pts`  
**Priority**: `P0 (Core)`  
**Assignee**: Developer Agent (`Amelia`)  
**Cross-References**: [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md) | [`docs/stories/story-1.2.md`](file:///Users/battosai/Dev/menucast/docs/stories/story-1.2.md) | [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md)  
**Created Date**: 2026-08-24  

---

## 1. User Story Statement

> **As a** store manager and multi-location operator,  
> **I want** a centralized, interactive dashboard showing all my screens, their live connection status, active menu previews, and group assignments,  
> **So that** I can monitor my entire fleet of displays at a glance, organize screens into groups visually, and rename displays without touching physical TVs.

---

## 2. Problem Statement & Context

In [`STORY-1.2`](file:///Users/battosai/Dev/menucast/docs/stories/story-1.2.md), we established the database schema (`screen_groups`, `tv_group_memberships`) and REST APIs (`/api/tv/groups`). However, store managers currently only see a raw list of screens without group filtering, visual group badges, live online/offline heartbeat status, or group management tools.

To provide an intuitive fleet management experience, the Web Dashboard (`/dashboard`) needs:
1. **Screen Group Filtering & Badging**: Tabbed filtering by group, colored group badges on each screen card, and a "Manage Groups" modal to create, edit, assign TVs, and delete groups.
2. **Realtime Heartbeat Telemetry & Status Badges**: TV clients report periodic heartbeats every 30s (`POST /api/tv/heartbeat`), and the dashboard highlights active displays with a pulsing green `Online` badge vs. `Offline (last seen Xm ago)`.
3. **Inline TV Renaming**: Fast inline editing of display names (`POST /api/tv/update`).
4. **Hardware Aspect Ratio & Resolution Indicators**: Clear pills indicating `16:9 Landscape` or `9:16 Portrait` and physical pixel dimensions.

---

## 3. Acceptance Criteria (Given / When / Then)

### AC-1: Screen Group Filter Tabs & TV Card Badges
- **Given** an authenticated user on `/dashboard` with screens assigned to groups,
- **When** the dashboard renders,
- **Then** group filter pills are shown at the top: `All Screens (N)`, `Unassigned (N)`, and custom group pills (e.g. `Bar TVs (3)` with their custom color dot).
- **When** clicking a group filter pill,
- **Then** the screen grid dynamically filters to show only screens belonging to the selected group.
- **And** each TV card displays badge tags for the groups it belongs to.

### AC-2: "Manage Groups" Modal & Screen Assignment UI
- **Given** the user clicks "Manage Groups" or "Create Group" on `/dashboard`,
- **When** the modal opens,
- **Then** the user can:
  - Create a new group (Name, optional Description, and Color picker).
  - Assign / unassign TVs to the group using multi-select checkboxes.
  - Edit existing group details or delete a group with confirmation.
- **When** saving changes,
- **Then** the API (`/api/tv/groups`) updates PostgreSQL and the dashboard state reflects the new groups and assignments immediately.

### AC-3: Heartbeat Telemetry & Live Online/Offline Badges
- **Given** an active TV running `/tv`,
- **When** the player is open,
- **Then** it sends a background heartbeat ping (`POST /api/tv/heartbeat`) every 30 seconds, updating `tvs.last_seen_at`.
- **Given** the dashboard on `/dashboard`,
- **When** displaying screen cards,
- **Then** screens with `last_seen_at` within the last 60 seconds show a pulsing green `● Online` badge. Screens exceeding 60 seconds show a neutral/red `○ Offline` badge with relative time (e.g. "Offline · 12m ago").

### AC-4: Inline TV Renaming API & UI
- **Given** a TV card on `/dashboard`,
- **When** clicking the edit pencil icon next to the TV name,
- **Then** the name becomes an editable input field with Save (`Enter` or checkmark) and Cancel (`Esc` or cross).
- **When** submitted,
- **Then** `POST /api/tv/update` updates `tvs.name` in PostgreSQL and updates the UI state without a full page reload.

### AC-5: Hardware Specs & Menu Thumbnail Display
- **Given** a paired TV card,
- **When** rendered on the dashboard,
- **Then** it displays:
  - Aspect ratio badge (`16:9` / `9:16` / `Custom`) and resolution (e.g., `1920 × 1080`).
  - Active menu image thumbnail with zoom/preview on click.
  - Active mode indicator (`Static 2x` or `Hybrid Live Text`).

---

## 4. Technical Architecture & Database Migration

### 4.1. Database Migration: `supabase/migrations/005_tv_heartbeat.sql`

```sql
-- Add last_seen_at timestamp to tvs table
ALTER TABLE tvs 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Index for fast status checking
CREATE INDEX IF NOT EXISTS idx_tvs_last_seen_at ON tvs(last_seen_at);
```

### 4.2. API Routes Breakdown

| Route | Method | Purpose | Auth Mechanism |
| :--- | :--- | :--- | :--- |
| `apps/web/app/api/tv/heartbeat/route.ts` | `POST` | TV player sends periodic ping with `{ tv_id }` | Public / TV Token |
| `apps/web/app/api/tv/update/route.ts` | `POST` | Updates TV metadata (e.g. `{ tv_id, name }`) | Session / Bearer Token |
| `apps/web/app/dashboard/page.tsx` | Server Component | Fetches initial TVs, Groups, and Group Memberships | NextAuth Session |
| `apps/web/app/dashboard/dashboard-client.tsx` | Client Component | Interactive group filters, manage groups modal, inline renaming, heartbeat indicators | Client State |

---

## 5. Implementation Steps & File Modifications

1. **Migration & Types**:
   * Create [`supabase/migrations/005_tv_heartbeat.sql`](file:///Users/battosai/Dev/menucast/supabase/migrations/005_tv_heartbeat.sql).
   * Update [`packages/supabase/types.ts`](file:///Users/battosai/Dev/menucast/packages/supabase/types.ts) to include `last_seen_at?: string | null` in `tvs` Row/Insert/Update.
2. **Heartbeat & TV Update API Routes**:
   * Create [`apps/web/app/api/tv/heartbeat/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/heartbeat/route.ts) to update `last_seen_at = now()`.
   * Create [`apps/web/app/api/tv/update/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/update/route.ts) to update TV name and attributes with user ownership validation.
3. **TV Display Heartbeat Loop**:
   * Update [`apps/web/app/tv/page.tsx`](file:///Users/battosai/Dev/menucast/apps/web/app/tv/page.tsx) to send a heartbeat every 30 seconds when paired.
4. **Dashboard Server Page**:
   * Update [`apps/web/app/dashboard/page.tsx`](file:///Users/battosai/Dev/menucast/apps/web/app/dashboard/page.tsx) to load initial `screen_groups` and `tv_group_memberships` in parallel.
5. **Dashboard Client UI Overhaul**:
   * Update [`apps/web/app/dashboard/dashboard-client.tsx`](file:///Users/battosai/Dev/menucast/apps/web/app/dashboard/dashboard-client.tsx) with:
     * Group filter pill navigation.
     * "Manage Groups" modal (Create / Edit / Assign TVs / Delete).
     * Group badges on TV cards.
     * Live heartbeat online/offline badges (`● Online` vs `○ Offline`).
     * Inline renaming with save/cancel.
     * Aspect ratio & resolution badges.

---

## 6. Verification & Testing Strategy

### Automated & Build Checks
- Run `pnpm build` to ensure zero TypeScript errors.

### Manual / User Verification Steps
1. Navigate to `/dashboard`.
2. Verify group filter tabs appear at the top.
3. Click "Manage Groups" $\rightarrow$ Create a group "Bar Displays" (color blue) $\rightarrow$ Assign 1 screen $\rightarrow$ Verify card receives "Bar Displays" badge.
4. Filter by "Bar Displays" $\rightarrow$ Verify only the assigned screen is visible.
5. Click pencil icon next to TV name $\rightarrow$ Edit to "Front Counter TV #1" $\rightarrow$ Press Enter $\rightarrow$ Verify name is saved.
6. Open `/tv` in another tab $\rightarrow$ Verify status badge turns green `● Online` on `/dashboard`.

---

## 7. Definition of Done Checklist

- [x] Migration `005_tv_heartbeat.sql` created and `packages/supabase/types.ts` updated.
- [x] Heartbeat endpoint `/api/tv/heartbeat` and `/tv` background ping implemented.
- [x] Inline TV renaming endpoint `/api/tv/update` implemented.
- [x] Group filtering, group badges, and "Manage Groups" modal built in `/dashboard`.
- [x] Monorepo passes `pnpm build` cleanly with zero TypeScript errors.
- [x] [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md) and [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) updated.
