# Story Specification: STORY-5.2 — Password Reset, Profile Management & Account Deletion (GDPR Data Purge)

**Document Status**: `In Progress`  
**Story ID**: `STORY-5.2`  
**Epic**: [`EPIC-5: Self-Serve User Accounts & Auth`](file:///Users/battosai/Dev/menucast/docs/epics.md#L98-L115)  
**Sprint**: [`Sprint 2: Public Launchpad (Landing Page & User Accounts)`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L41-L60)  
**Story Points**: `4 pts`  
**Priority**: `P1 (MVP Core)`  
**Assignee**: Developer Agent (`Amelia`)  
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/architecture.md`](file:///Users/battosai/Dev/menucast/docs/architecture.md) | [`docs/sprint-plan.md`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md)  
**Created Date**: 2026-08-31  

---

## 1. User Story Statement

> **As an** authenticated user or restaurant owner,  
> **I want to** update my profile details (name, password), manage my Figma integration token, and permanently delete my account and all associated data if needed,  
> **So that** I have complete control over my credentials, privacy, and connected hardware assets.

---

## 2. Problem Statement & Context

1. **Profile & Password Management**: Users need a way to change their display name and update their account password from within the dashboard without logging out.
2. **Account Deletion (Privacy & Compliance)**: To comply with privacy laws (GDPR, CCPA) and provide standard SaaS self-service, users must be able to delete their account.
3. **Cascade Data Purging**: When an account is deleted, all user records (`tvs`, `menus`, `api_tokens`, `screen_groups`, uploaded images in Supabase Storage, and Supabase Auth identities) must be cleanly and permanently purged, followed by session revocation and client sign-out.

---

## 3. Visual & Design System Specifications

### 3.1 Account Settings Modal (`dashboard-client.tsx`)
* **Modal Shell**: Fixed backdrop `bg-black/60 backdrop-blur-xs`, centered card `bg-[var(--surface)]` border `border-[var(--accent-soft)]` rounded-2xl max-w-lg w-full p-6 shadow-2xl.
* **Sections**:
  1. **Profile & Credentials**:
     * Display Name input with "Save Name" button.
     * Change Password section (New Password + Confirm Password) with "Update Password" action.
  2. **Figma Plugin Integration**:
     * API Token display, 1-click copy button, and Regenerate Token button.
  3. **Danger Zone**:
     * Red soft-toned card container (`bg-red-500/10 border border-red-500/30 rounded-xl p-4`).
     * Warning text explaining that deleting the account permanently deletes all paired screens, uploaded menu assets, and tokens.
     * "Delete Account" button (`bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-xs font-bold`).

### 3.2 Account Deletion Confirmation Modal
* Dedicated high-priority alert dialog requiring the user to type `DELETE` to enable the destructive action.
* "Cancel" (`bg-[var(--surface-soft)]`) vs "Permanently Delete My Account" (`bg-red-600 text-white`).

---

## 4. Acceptance Criteria (Given / When / Then)

### AC-1: Password Reset Link & Recovery Handling (`/forgot-password` & `/reset-password`)
- **Given** an existing user requesting password reset at `/forgot-password`,
- **When** the reset email link is clicked,
- **Then** the user is directed to `/reset-password`, where entering and confirming a new $\ge 8$ character password successfully updates credentials and redirects to `/login?reset=success`.

### AC-2: Profile Updates in Dashboard Account Settings (`PATCH /api/auth/profile`)
- **Given** an authenticated user in the Account Modal on `/dashboard`,
- **When** updating their display name or updating their password,
- **Then** `PATCH /api/auth/profile` updates Supabase metadata and password, displaying a success toast/banner.

### AC-3: Danger Zone & Account Deletion Safeguard
- **Given** an authenticated user in Account Settings,
- **When** clicking "Delete Account",
- **Then** a confirmation modal is displayed requiring explicit confirmation (typing `DELETE`) before enabling the deletion button.

### AC-4: Permanent Cascade Data Purge (`DELETE /api/auth/account`)
- **Given** an authenticated user submitting confirmed account deletion,
- **When** `DELETE /api/auth/account` executes,
- **Then**:
  1. All paired screens (`tvs`), menu push records (`menus`), API tokens (`api_tokens`), and screen groups (`screen_groups`) are purged via PostgreSQL `ON DELETE CASCADE`.
  2. Storage files under the user's storage bucket prefix are deleted.
  3. Supabase Auth user record is deleted via `supabase.auth.admin.deleteUser()`.
  4. NextAuth session is terminated and client redirects to `/?deleted=true` with confirmation banner.

---

## 5. Technical Implementation Plan & Code Map

### 5.1 Route & File Structure

```
apps/web/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── profile/
│   │       │   └── route.ts        # [NEW] PATCH /api/auth/profile for name & password update
│   │       └── account/
│   │           └── route.ts        # [NEW] DELETE /api/auth/account for permanent cascade delete
│   └── dashboard/
│       └── dashboard-client.tsx    # [MODIFY] Enhanced Account Modal with Profile, Password, & Danger Zone deletion
```

---

## 6. Tasks / Subtasks

- [x] Task 1: Create `apps/web/app/api/auth/profile/route.ts` (Profile & Password Update)
  - [x] Support `PATCH` request with session auth
  - [x] Validate and update display name in Supabase user metadata
  - [x] Validate and update user password with $\ge 8$ characters
- [x] Task 2: Create `apps/web/app/api/auth/account/route.ts` (Permanent Account Deletion)
  - [x] Support `DELETE` request with session auth and `{ confirmation: "DELETE" }`
  - [x] Clean up user files in Supabase Storage `menus` bucket
  - [x] Call `supabase.auth.admin.deleteUser(session.user.id)` triggering Postgres cascade delete
  - [x] Return `{ success: true, message: "Account deleted" }`
- [x] Task 3: Enhance Account Settings Modal in `apps/web/app/dashboard/dashboard-client.tsx`
  - [x] Add Profile Name editing with save feedback
  - [x] Add Change Password form with validation
  - [x] Add Danger Zone section with Delete Account trigger
  - [x] Build Delete Account Confirmation Dialog with confirmation text validation
  - [x] Connect delete action to `DELETE /api/auth/account` and `signOut({ callbackUrl: "/login?deleted=true" })`
- [x] Task 4: Automated Testing & Build Validation
  - [x] Run `pnpm --filter web build` to verify type safety and compilation
  - [x] Verify error handling for unauthenticated requests and invalid confirmation tokens

---

## 7. Status & Dev Agent Record

**Status**: `Completed / Verified`  
**Dev Notes & Completion Record**:
- Implemented `PATCH /api/auth/profile` with input validation, session authentication, and Supabase Admin user metadata/password updates.
- Implemented `DELETE /api/auth/account` requiring `{ confirmation: "DELETE" }`, cleaning up `menus` storage folder, and executing `supabase.auth.admin.deleteUser()` triggering PostgreSQL `ON DELETE CASCADE` across `tvs`, `menus`, `api_tokens`, and `screen_groups`.
- Enhanced `apps/web/app/dashboard/dashboard-client.tsx` with a comprehensive Account & Profile Settings modal:
  - Profile Information: Display name editor with inline save feedback.
  - Security: Change password form with validation ($\ge 8$ chars, match check).
  - Figma Integration: Retained API token generation & clipboard copy.
  - Danger Zone: Delete Account trigger leading to an explicit confirmation modal with keyword typing safeguard ("DELETE").
- Enhanced `apps/web/app/login/page.tsx` with friendly confirmation alert banners for `?deleted=true` and `?reset=success`.
- Validated with `pnpm --filter web build` (successful production build with zero TypeScript or bundling errors).

### File List
- `apps/web/app/api/auth/profile/route.ts` (New)
- `apps/web/app/api/auth/account/route.ts` (New)
- `apps/web/app/dashboard/dashboard-client.tsx` (Modified)
- `apps/web/app/login/page.tsx` (Modified)
- `docs/stories/story-5.2.md` (New)
