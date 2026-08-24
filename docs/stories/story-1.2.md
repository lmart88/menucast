# Story Specification: STORY-1.2 — Multi-Screen Grouping & Tagging Schema & APIs

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-1.2`  
**Epic**: [`EPIC-1: Screen Pairing & Fleet Management`](file:///Users/battosai/Dev/menucast/docs/epics.md#L42-L57)  
**Sprint**: [`Sprint 2: Multi-Screen Fleet Management & Offline Resilience`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L42-L57)  
**Story Points**: `5 pts`  
**Priority**: `P0 (Core)`  
**Assignee**: Developer Agent (`Amelia`)  
**Cross-References**: [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md) | [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md)  
**Created Date**: 2026-08-20  

---

## 1. User Story Statement

> **As a** multi-screen restaurant operator and digital signage manager,  
> **I want to** organize physical TV displays into logical groups and tags (e.g., "Main Menu Boards", "Bar TVs", "Drive-Thru Screens"),  
> **So that** I can manage display configurations collectively and prepare for multi-screen broadcasts in a single operation.

---

## 2. Problem Statement & Context

Currently, in Sprint 1, each TV is an individual entity identified by `tv_id` in the `tvs` table. While single-screen pairing and pushing work seamlessly, real-world venues have clusters of displays:
- A quick-service restaurant (QSR) has 3-5 displays behind the counter (e.g., Combos, Drinks, Burgers).
- A sports bar has 10+ screens across different dining zones.
- Changing menus or checking status screen-by-screen becomes repetitive and error-prone.

To unlock fleet management ([`STORY-1.3`](file:///Users/battosai/Dev/menucast/docs/epics.md#L59-L73)), daypart scheduling ([`STORY-4.1`](file:///Users/battosai/Dev/menucast/docs/epics.md#L220-L234)), and Figma group-targeted pushes, we need a clean relational schema and RESTful API layer for **Screen Groups** and **TV Group Memberships**.

---

## 3. Acceptance Criteria (Given / When / Then)

### AC-1: Screen Groups Database Migration & RLS Security
- **Given** the Supabase database instance,
- **When** migration `004_screen_groups.sql` executes,
- **Then** two new tables are created: `screen_groups` and `tv_group_memberships` with foreign key constraints, timestamps, and cascading deletes.
- **And** Row Level Security (RLS) is enabled on both tables ensuring users can only read, insert, update, and delete groups and memberships belonging to their own `user_id` / owned TVs.

### AC-2: Create & List Screen Groups API (`GET` / `POST` `/api/tv/groups`)
- **Given** an authenticated user (via Session cookie or Bearer API token),
- **When** calling `GET /api/tv/groups`,
- **Then** the endpoint returns HTTP `200 OK` with a JSON array of groups owned by the user, including the count and list of TV members attached to each group.
- **Given** an authenticated user submitting `{ name: "Bar TVs", description: "All displays over the bar counter", color?: "#3b82f6" }`,
- **When** calling `POST /api/tv/groups`,
- **Then** a new row is inserted into `screen_groups` and returns HTTP `201 Created` with the group entity.

### AC-3: Update & Delete Screen Groups API (`PATCH` / `DELETE` `/api/tv/groups/[id]`)
- **Given** an existing screen group ID owned by the caller,
- **When** calling `PATCH /api/tv/groups/[id]` with `{ name, description }`,
- **Then** the record is updated in `screen_groups` and returns HTTP `200 OK`.
- **When** calling `DELETE /api/tv/groups/[id]`,
- **Then** the group is deleted, associated memberships are cascaded/removed, and the API returns HTTP `200 OK` without deleting the underlying physical TVs.

### AC-4: Group Membership Management API (`POST` / `DELETE` `/api/tv/groups/[id]/members`)
- **Given** a valid group ID and an array of `tv_ids` owned by the user,
- **When** calling `POST /api/tv/groups/[id]/members` with `{ tv_ids: ["uuid-1", "uuid-2"] }`,
- **Then** the TV memberships are upserted into `tv_group_memberships` and the updated group member list is returned.
- **When** calling `DELETE /api/tv/groups/[id]/members` with `{ tv_ids: ["uuid-1"] }`,
- **Then** the membership record is removed and the TV is disassociated from the group.

### AC-5: TypeScript Definitions & Monorepo Build Integrity
- **Given** the updated schema,
- **When** `packages/supabase/types.ts` is updated with `screen_groups` and `tv_group_memberships` interfaces,
- **Then** running `pnpm build` across the monorepo passes with zero TypeScript errors.

---

## 4. Technical Architecture & Implementation Plan

### 4.1. Database Schema (`supabase/migrations/004_screen_groups.sql`)

```sql
-- Screen Groups table
CREATE TABLE screen_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TV to Group Memberships (Many-to-Many or One-to-Many join table)
CREATE TABLE tv_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES screen_groups(id) ON DELETE CASCADE,
  tv_id UUID NOT NULL REFERENCES tvs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, tv_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_screen_groups_user_id ON screen_groups(user_id);
CREATE INDEX idx_tv_group_memberships_group_id ON tv_group_memberships(group_id);
CREATE INDEX idx_tv_group_memberships_tv_id ON tv_group_memberships(tv_id);

-- Enable RLS
ALTER TABLE screen_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_group_memberships ENABLE ROW LEVEL SECURITY;

-- Screen Groups RLS Policies
CREATE POLICY "Users own their screen groups"
  ON screen_groups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TV Group Memberships RLS Policies
CREATE POLICY "Users manage memberships of owned groups"
  ON tv_group_memberships FOR ALL
  USING (
    group_id IN (SELECT id FROM screen_groups WHERE user_id = auth.uid())
  )
  WITH CHECK (
    group_id IN (SELECT id FROM screen_groups WHERE user_id = auth.uid())
  );
```

### 4.2. API Routes Breakdown

| Route | Method | Purpose | Auth Mechanism |
| :--- | :--- | :--- | :--- |
| `apps/web/app/api/tv/groups/route.ts` | `GET` | List all groups for user with nested TV members | Session or Bearer Token |
| `apps/web/app/api/tv/groups/route.ts` | `POST` | Create a new screen group | Session or Bearer Token |
| `apps/web/app/api/tv/groups/[id]/route.ts` | `GET` | Get single group details and members | Session or Bearer Token |
| `apps/web/app/api/tv/groups/[id]/route.ts` | `PATCH` | Update group name/description/color | Session or Bearer Token |
| `apps/web/app/api/tv/groups/[id]/route.ts` | `DELETE` | Delete group (preserves TVs) | Session or Bearer Token |
| `apps/web/app/api/tv/groups/[id]/members/route.ts` | `POST` | Add TVs to group | Session or Bearer Token |
| `apps/web/app/api/tv/groups/[id]/members/route.ts` | `DELETE` | Remove TVs from group | Session or Bearer Token |

### 4.3. Authentication Helper
Use the shared authentication pattern supporting both:
1. `auth()` NextAuth session for `/dashboard` client requests.
2. `Authorization: Bearer <API_TOKEN>` for Figma plugin / programmatic API calls.

---

## 5. Implementation Steps & File Modifications

1. **Migration File**: Create [`supabase/migrations/004_screen_groups.sql`](file:///Users/battosai/Dev/menucast/supabase/migrations/004_screen_groups.sql).
2. **Type Definitions**: Update [`packages/supabase/types.ts`](file:///Users/battosai/Dev/menucast/packages/supabase/types.ts) to include `screen_groups` and `tv_group_memberships` table definitions in `Database["public"]["Tables"]`.
3. **API Collection Handler**: Create [`apps/web/app/api/tv/groups/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/groups/route.ts) for `GET` and `POST`.
4. **API Item Handler**: Create [`apps/web/app/api/tv/groups/[id]/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/groups/[id]/route.ts) for `GET`, `PATCH`, `DELETE`.
5. **API Members Handler**: Create [`apps/web/app/api/tv/groups/[id]/members/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/groups/[id]/members/route.ts) for `POST` and `DELETE`.
6. **TV List Enrichment (Optional/Enhancement)**: Update [`apps/web/app/api/tv/list/route.ts`](file:///Users/battosai/Dev/menucast/apps/web/app/api/tv/list/route.ts) to join `tv_group_memberships(group_id, screen_groups(id, name))` so TV list queries return assigned group badges.

---

## 6. Verification & Testing Strategy

### Automated & Build Verification
- Run `pnpm build` to ensure all TypeScript types compile without errors.
- Validate JSON response structure for API endpoints with mock/test payloads.

### Manual / Integration Testing Steps
1. Call `POST /api/tv/groups` with `{ name: "Bar Displays", description: "Main bar area" }` $\rightarrow$ Expect `201 Created` with generated `id`.
2. Call `GET /api/tv/groups` $\rightarrow$ Expect list containing `"Bar Displays"`.
3. Call `POST /api/tv/groups/[id]/members` with valid `tv_ids` $\rightarrow$ Expect TVs linked to group.
4. Call `GET /api/tv/groups` $\rightarrow$ Expect members array populated.
5. Call `DELETE /api/tv/groups/[id]/members` $\rightarrow$ Expect TV removed from group.
6. Call `DELETE /api/tv/groups/[id]` $\rightarrow$ Expect group removed, TVs preserved in `tvs` table.

---

## 7. Definition of Done Checklist

- [x] Database migration `004_screen_groups.sql` created with RLS.
- [x] Supabase TypeScript types updated in `packages/supabase/types.ts`.
- [x] Endpoints implemented with dual authentication (Session + Bearer Token).
- [x] Input validation applied for all request payloads.
- [x] `pnpm build` passes with zero TypeScript warnings or errors.
- [x] Sprint plan [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md) status updated to `🟢 DONE (Verified)`.
