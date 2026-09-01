---
title: 'Account Registration Kill-Switch & Access Control'
type: 'feature'
created: '2026-09-01'
status: 'approved'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/spec-auth-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** During production testing and private staging, public users and web scrapers could discover `/register` and create unauthorized user accounts. The platform administrator needs a reliable mechanism to turn account registration on/off on demand, while maintaining the ability for authorized testers to create test accounts in production.

**Approach:** Implement a hybrid registration guard combining an environment kill-switch (`REGISTRATION_ENABLED`), an optional secret bypass key (`REGISTRATION_BYPASS_KEY`), and an optional email whitelist (`ALLOWED_REGISTRATION_EMAILS`). When registration is disabled, `/register` renders a branded "Registration Closed" state and `POST /api/auth/register` rejects unauthorized requests with HTTP 403 Forbidden.

## Boundaries & Constraints

**Always:**
- Keep default behavior open when `REGISTRATION_ENABLED` is omitted or set to `"true"`.
- Reject direct API submissions with HTTP 403 when registration is disabled and no valid bypass key or whitelisted email is supplied.
- Maintain visual harmony with the miniKast authentication design system (`AuthShell`, cyan border, rounded-2xl container, brand typography and button styling).
- Support bypass parameter via URL query string (`/register?key=...`), request header (`x-registration-key`), and JSON request body (`bypassKey`).

**Never:**
- Leak the configured `REGISTRATION_BYPASS_KEY` or `ALLOWED_REGISTRATION_EMAILS` to client-side bundles or public API responses.
- Break existing authentication sessions or login flow on `/login`.

## Environment Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `REGISTRATION_ENABLED` | `"true"` \| `"false"` | `"true"` | Global toggle for public account creation. Set to `"false"` to lock down registration. |
| `REGISTRATION_BYPASS_KEY` | string | `""` | Optional secret passphrase enabling authorized testers to register via `?key=<SECRET>`. |
| `ALLOWED_REGISTRATION_EMAILS` | string | `""` | Optional comma-separated list of pre-approved emails allowed to register when disabled. |

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Status Code |
|---|---|---|---|
| **REG_ENABLED_DEFAULT** | `REGISTRATION_ENABLED=true` | Full registration form rendered, accounts created normally | 201 Created |
| **REG_DISABLED_PUBLIC** | `REGISTRATION_ENABLED=false`, no key | "Registration Closed" card rendered on UI; API returns `{ error: "..." }` | 403 Forbidden |
| **REG_DISABLED_BYPASS_KEY** | `REGISTRATION_ENABLED=false`, valid `?key=...` | Form unlocks and passes key to API; account is provisioned | 201 Created |
| **REG_DISABLED_INVALID_KEY** | `REGISTRATION_ENABLED=false`, invalid key | "Registration Closed" card rendered on UI; API returns 403 | 403 Forbidden |
| **REG_DISABLED_WHITELISTED_EMAIL** | `REGISTRATION_ENABLED=false`, email in whitelist | API approves registration even if key omitted | 201 Created |

</frozen-after-approval>

## Code Map

- `apps/web/app/api/auth/register/route.ts` — Server route enforcing registration status, bypass keys, and email whitelist.
- `apps/web/app/register/page.tsx` — Server component determining whether to render the active form or the closed card.
- `apps/web/app/register/register-form.tsx` — Client component for interactive registration form.
- `apps/web/app/register/registration-closed-card.tsx` — Visual presentation for closed registration state.
- `apps/web/.env.example` — Environment variable documentation.
