---
title: 'Login & Registration UI Redesign (Auth Flow)'
type: 'feature'
created: '2026-08-28'
status: 'draft'
figma_node: '1456:9252'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1456-9252'
context:
  - `{project-root}/project-context.md`
  - `{project-root}/docs/prd.md`
  - `{project-root}/docs/epics.md`
  - `{project-root}/docs/sprint-plan.md`
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current `/login` screen is an unstyled dark-mode prototype and `/register` simply redirects to `/login`. Both pages need to match the updated visual identity and Figma designs, providing a seamless Email/Password authentication experience for MVP.

**Approach:** Implement modern, responsive `/login` and `/register` pages adhering to the approved Figma design (`node-id=1456:9252`). The design features a light cyan/mint radial backdrop, centered miniKast bird logo, clean floating container card with soft border (`#b7eaed`), and a prominent brand orange CTA button with accessible inputs and subtle secondary navigation. Social login is explicitly moved out of MVP scope.

## Boundaries & Constraints

**Always:** 
- Use Next.js App Router (`apps/web/app/login/page.tsx`, `apps/web/app/register/page.tsx`) with React 19 and Tailwind CSS.
- Adhere to the design tokens from Figma node `1456:9252`:
  - Background: Radial cyan gradient / subtle dotted atmospheric pattern (`#f7fcfc` to `#b7eaed`).
  - Card container: `#ffffff`, border `1px solid #b7eaed`, border-radius `16px`, soft depth shadow (`0 1px 2px rgba(12, 12, 13, 0.05)`).
  - Primary button: Solid brand orange (`#f27200` / `#ff8000`), white text, bold `Nunito`, hover state with smooth transition.
  - Secondary CTA link: Subtle teal (`#00878a` / `#547a7c`) with clean hover states.
  - Inputs: Border `#b7eaed`, border-radius `8px`, height `40px`, placeholder `#547a7c`, clean focus ring.
- Enforce validation (valid email format, password matching on `/register`, min 8 characters).
- Maintain multi-tenant credentials authentication via NextAuth / Supabase credentials provider.

**Never:**
- Add third-party social OAuth buttons to MVP auth screens (deferred to Post-MVP in `docs/ideas.md`).
- Introduce external heavyweight UI component libraries.
- Break existing session callback redirects (e.g. `callbackUrl` handling to `/dashboard` or `/pair`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **LOGIN_HAPPY_PATH** | Valid email + password on `/login` | Successful authentication, redirect to `/dashboard` (or `callbackUrl`) | N/A |
| **REGISTER_HAPPY_PATH** | Valid email + matching passwords on `/register` | Account created in Postgres, session established, redirect to `/dashboard` | N/A |
| **INVALID_CREDENTIALS** | Incorrect password or non-existent email on `/login` | Inline alert message: "Invalid email or password" | Form remains editable, loading state clears |
| **PASSWORD_MISMATCH** | Passwords do not match on `/register` | Inline field error: "Passwords do not match" | Submission blocked before network call |
| **EXISTING_ACCOUNT** | Email already registered on `/register` | Inline alert message: "An account with this email already exists" | Direct link to `/login` surfaced |
| **LOADING_STATE** | Form submission in flight | Submit button enters disabled loading state ("Signing in..." / "Creating account...") | Prevent duplicate submissions |

</frozen-after-approval>

## Code Map

- `apps/web/app/login/page.tsx` — Login screen UI & credentials authentication.
- `apps/web/app/register/page.tsx` — Registration screen UI & account creation submission.
- `apps/web/app/api/auth/register/route.ts` — Server route for hashing password and provisioning user record.
- `apps/web/app/globals.css` — Auth background styling, tokens, and input styles.

## Acceptance Criteria

1. **Visual Accuracy**: `/login` and `/register` match Figma node `1456:9252` across mobile, tablet, and desktop viewports.
2. **Registration Flow**: Users can sign up with Email + Password + Confirm Password; account is created and auto-authenticated.
3. **Login Flow**: Users can sign in with valid credentials; redirect honors `callbackUrl`.
4. **Validation & Errors**: Clear, accessible inline feedback for validation errors and network/auth errors.
5. **No Social OAuth**: Social login buttons are absent in the MVP scope.
