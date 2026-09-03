---
title: 'Password Reset & Recovery Token Verification Flow Fix'
type: 'bug-fix & specification'
created: '2026-09-03'
status: 'draft'
figma_node: '1468:8036'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1468-8036'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/stories/story-5.1.md'
  - '{project-root}/docs/spec-auth-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## 1. Intent & Problem Statement

### 1.1 Problem Description
When users attempt to reset their password via email links or direct recovery links, the password reset form at `/reset-password` fails upon submission with the error:
> **"Failed to reset password. The link may have expired. Please request a new link."**

### 1.2 Root Cause Analysis
1. **Double-Consumption of Single-Use OTP (`token_hash`)**:
   - In `apps/web/app/reset-password/page.tsx`, `useEffect` calls `client.auth.verifyOtp({ token_hash, type: "recovery" })` on page load.
   - Supabase recovery tokens are single-use OTPs. Once verified in `useEffect`, the token is consumed in Supabase's database.
   - When the user submits the form (`handleSubmit`), a new client instance calls `verifyOtp` *again* with the already-consumed `token_hash`. Supabase rejects this second call with `otp_expired` / `invalid_token`.
2. **Missing `refresh_token` & Malformed `setSession`**:
   - For email recovery links that redirect via hash fragment (`#access_token=...&refresh_token=...`), `page.tsx` only extracts `access_token` and passes `refresh_token: accessToken` to `setSession`. Supabase Auth rejects JWT strings in the refresh token slot.
3. **Fragile Server-Side Reset Fallback**:
   - `apps/web/app/api/auth/reset-password/route.ts` attempts to call `setSession` with an anon client and fallback token, which fails. It does not use the Admin Client to verify the user via `getUser(access_token)` and execute `admin.updateUserById(userId, { password })`.
4. **Unchecked PKCE Authorization Codes (`?code=...`)**:
   - Standard Supabase Auth redirect URLs using PKCE provide a `?code=` query parameter. The current frontend treats `code` as an `access_token` rather than calling `exchangeCodeForSession(code)`.
5. **Conflicting Token Generation in Forgot-Password Route**:
   - `POST /api/auth/forgot-password` calls both `admin.generateLink` and `anonClient.resetPasswordForEmail`, generating two competing tokens for the same user.

---

## 2. Approach & Solution Architecture

### 2.1 Unified Token Resolution on `/reset-password`
The `/reset-password` client page must gracefully handle all 3 Supabase recovery mechanisms:
1. **Direct Token Hash (`?token_hash=...` or `#token_hash=...`)**:
   - Verify OTP once on mount (`verifyOtp({ token_hash, type: 'recovery' })`).
   - Store the resulting session/access token and mark verification as completed.
   - Do NOT attempt to re-verify the token hash on submission.
2. **Implicit Hash Fragment (`#access_token=...&refresh_token=...`)**:
   - Extract both `access_token` and `refresh_token`.
   - Set session on the client and verify user email.
   - Listen to `auth.onAuthStateChange` for `PASSWORD_RECOVERY` events.
3. **PKCE Authorization Code (`?code=...`)**:
   - Exchange code for session via `auth.exchangeCodeForSession(code)`.

### 2.2 Resilient Server-Side Reset Handler (`/api/auth/reset-password`)
- Accept `password` along with `access_token` or `token_hash`.
- For `access_token`: Verify user identity cryptographically via `supabase.auth.getUser(access_token)`.
- Upon successful user verification, execute `adminClient.auth.admin.updateUserById(userId, { password })`.
- Return clear error messages and 200 OK on success.

### 2.3 UX & Error State Enhancements
- If a link is truly invalid/expired on initial load, immediately display an inline warning with a direct "Request New Reset Link" button so the user does not waste time entering passwords.
- Display clear password policy validation (min 8 characters, password matching).
- On success, display confirmation checkmark and redirect to `/login?reset=success`.

---

## 3. Boundaries & Constraints

**Always:**
- Keep password hashing and management inside Supabase Auth / PostgreSQL.
- Support both local development direct links (`?token_hash=...`) and production email links (`#access_token=...` or `?code=...`).
- Match miniKast visual design system (`AuthShell`, `#f27200` CTA button, `#b7eaed` border card).
- Enforce a minimum password length of 8 characters.

**Never:**
- Call `verifyOtp` more than once with the same `token_hash`.
- Pass raw `access_token` into the `refresh_token` argument of `setSession`.
- Expose the Supabase Service Role Key on the client side.

---

## 4. I/O & Edge-Case Matrix

| Scenario | Input URL / Parameters | Expected Behavior | UI / API Status |
|---|---|---|---|
| **OTP_DIRECT_LINK** | `/reset-password?token_hash=abc&email=test@example.com` | OTP verified once on mount; session created; submitting new password updates password via Supabase. | Success card -> redirect to `/login?reset=success` |
| **SUPABASE_HASH_LINK** | `/reset-password#access_token=jwt&refresh_token=rt&type=recovery` | Session established from hash params; password updated. | Success card -> redirect to `/login?reset=success` |
| **PKCE_CODE_LINK** | `/reset-password?code=auth_code` | PKCE code exchanged for session; password updated. | Success card -> redirect to `/login?reset=success` |
| **EXPIRED_LINK** | Expired or already-used `token_hash` / `access_token` | Initial verification warning: "This password reset link is invalid or has expired." with CTA "Request New Link". | Inline alert + Link to `/forgot-password` |
| **PASSWORD_MISMATCH** | Passwords do not match | Client validation error "Passwords do not match". No network call. | Inline alert |
| **SHORT_PASSWORD** | Password $< 8$ characters | Client validation error "Password must be at least 8 characters long". | Inline alert |

</frozen-after-approval>

---

## 5. Code Map

- `apps/web/app/reset-password/page.tsx` — Client component handling multi-format token verification, single-use OTP management, auth state change listener, and password update submission.
- `apps/web/app/api/auth/reset-password/route.ts` — Server route validating access tokens and updating user password via Supabase Admin Client.
- `apps/web/app/api/auth/forgot-password/route.ts` — Cleaned up password recovery dispatch route avoiding duplicate token generation.
- `docs/stories/story-5.1.md` — Updated story specifications.

---

## 6. Acceptance Criteria

1. **Successful Password Reset via Direct OTP Link**: Navigating to a direct reset link (`?token_hash=...`) correctly verifies the user once, populates email, and allows setting a new password without "link expired" error.
2. **Successful Password Reset via Email Hash Link**: Links containing `#access_token=...&refresh_token=...` successfully establish a recovery session and update password.
3. **Successful Password Reset via PKCE Code**: Links containing `?code=...` properly exchange code for session and update password.
4. **Expired/Invalid Link Detection**: Visiting an expired link displays an immediate clear explanation with a "Request a new link" button.
5. **Login with New Password**: After resetting password, the user can immediately log in on `/login` using their new password.
6. **Build & Type Check**: `pnpm build` succeeds across all packages.
