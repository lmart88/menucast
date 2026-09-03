---
title: 'Dev Mode Password Reset Button Toggle (DEV_PASSWORD_RESET)'
type: 'feature & access-control'
created: '2026-09-03'
status: 'approved'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/spec-password-reset-fix.md'
  - '{project-root}/docs/spec-registration-toggle.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## 1. Intent & Problem Statement

### 1.1 Problem Description
The `/forgot-password` screen currently renders an "Open Reset Link Directly (Dev Mode)" helper button whenever a password reset request succeeds. In production or private staging environments, exposing the direct reset link in the response and UI allows anyone requesting a password reset to bypass email inbox verification.

### 1.2 Approach
Introduce an environment variable `DEV_PASSWORD_RESET` (and `NEXT_PUBLIC_DEV_PASSWORD_RESET`) to toggle whether the direct dev reset link is generated, returned by the API, and displayed in the UI:
- When `DEV_PASSWORD_RESET="false"`: The API will NOT include `direct_link` in the response payload, and the UI will suppress the "Open Reset Link Directly (Dev Mode)" button completely.
- When `DEV_PASSWORD_RESET` is unset or set to `"true"` (or `process.env.NODE_ENV === "development"`): The direct reset link is returned and displayed for developer convenience.

---

## 2. Environment Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `DEV_PASSWORD_RESET` | `"true"` \| `"false"` | `"true"` (dev) / `"false"` (prod default) | Backend toggle controlling whether `direct_link` is generated and returned by `POST /api/auth/forgot-password`. |
| `NEXT_PUBLIC_DEV_PASSWORD_RESET` | `"true"` \| `"false"` | `"true"` (dev) / `"false"` (prod default) | Client-visible toggle to conditionally render the direct testing link button on `/forgot-password`. |

---

## 3. Boundaries & Constraints

**Always:**
- Omit `direct_link` from `POST /api/auth/forgot-password` JSON responses when `DEV_PASSWORD_RESET="false"`.
- Ensure standard Supabase email dispatch via `anonClient.auth.resetPasswordForEmail` continues to function regardless of this toggle.
- Update `.env.example` to document `DEV_PASSWORD_RESET`.

**Never:**
- Expose direct recovery token links to unauthenticated API clients when `DEV_PASSWORD_RESET="false"`.
- Break normal forgot-password flow or confirmation state.

---

## 4. I/O & Edge-Case Matrix

| Scenario | `DEV_PASSWORD_RESET` | API Response `direct_link` | UI "Dev Mode" Button |
|---|---|---|---|
| **DEV_MODE_ENABLED** | `"true"` or unset in dev | `https://.../reset-password?token_hash=...` | Rendered with clickable link |
| **DEV_MODE_DISABLED** | `"false"` | `undefined` / omitted | Hidden completely |
| **INVALID_VALUE** | `"false"` (case-insensitive) | Omitted | Hidden completely |

</frozen-after-approval>

---

## 5. Code Map

- `apps/web/app/api/auth/forgot-password/route.ts` — Server route checking `DEV_PASSWORD_RESET` before generating `generateLink` or returning `direct_link`.
- `apps/web/app/forgot-password/page.tsx` — Client UI checking `NEXT_PUBLIC_DEV_PASSWORD_RESET` and response `direct_link`.
- `apps/web/.env.example` — Documentation of `DEV_PASSWORD_RESET` and `NEXT_PUBLIC_DEV_PASSWORD_RESET`.
