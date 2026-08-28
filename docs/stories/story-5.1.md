# Story Specification: STORY-5.1 — Self-Serve Registration, Login, and Password Recovery Flow (Redesigned UI)

**Document Status**: `Completed / Verified`  
**Story ID**: `STORY-5.1`  
**Epic**: [`EPIC-5: Self-Serve User Accounts & Auth`](file:///Users/battosai/Dev/menucast/docs/epics.md#L89-L101)  
**Sprint**: [`Sprint 2: Public Launchpad (Landing Page & User Accounts)`](file:///Users/battosai/Dev/menucast/docs/sprint-plan.md#L41-L58)  
**Story Points**: `5 pts`  
**Priority**: `P1 (MVP Core)`  
**Assignee**: Developer Agent (`Amelia`)  
**Figma References**:
* **Section Node**: [`1452:6196`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1452-6196) ("Login & Registration")
* **Login Screen Node**: [`1456:9079`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1456-9079) ("Login")
* **Registration Screen Node**: [`1456:9252`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1456-9252) ("Create Account")
* **Forgot Password Screen Node**: [`1468:7574`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1468-7574) ("Forgot Password")
* **Password Reset Screen Node**: [`1468:8036`](https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1468-8036) ("Password Reset")
**Cross-References**: [`docs/prd.md`](file:///Users/battosai/Dev/menucast/docs/prd.md) | [`docs/epics.md`](file:///Users/battosai/Dev/menucast/docs/epics.md) | [`docs/spec-auth-ui-redesign.md`](file:///Users/battosai/Dev/menucast/docs/spec-auth-ui-redesign.md)  
**Created Date**: 2026-08-28  

---

## 1. User Story Statement

> **As a** restaurant owner, general manager, or brand designer,  
> **I want to** easily create an account, log in, or recover my password using a clean, branded email/password authentication interface matching the new miniKast design system,  
> **So that** I can securely access my screen management dashboard and pair TV displays without friction.

---

## 2. Problem Statement & Context

Currently:
1. `/login` is an unstyled dark-mode prototype with basic inputs and no brand alignment with the updated homepage.
2. `/register` simply redirects back to `/login` with no registration form or user onboarding flow.
3. `/forgot-password` does not exist.
4. Social OAuth (Google/GitHub) has been deferred to Post-MVP in [`docs/ideas.md`](file:///Users/battosai/Dev/menucast/docs/ideas.md) to prioritize a lightweight, frictionless, and secure Email & Password authentication flow.

The Figma design system (Section `1452:6196`) defines 3 unified, aesthetic auth screens:
* **Login (`/login`)**: Email & Password fields, primary brand orange "Login" button, secondary outlined "Create Account" button, and "Forgot Password?" text link.
* **Create Account (`/register`)**: Email, Create Password, and Confirm Password fields, primary brand orange "Create Account" button, and secondary "Back to Login" text link.
* **Forgot Password (`/forgot-password`)**: Email field, primary brand orange "Submit" button, and secondary "Back to Login" text link.

---

## 3. Visual & Design System Specifications

All three screens share a cohesive visual layout:

### 3.1 Atmosphere & Container
* **Backdrop**: Mint/cyan gradient surface (`#f7fcfc` background with radial cyan glow `#b7eaed` / subtle dot pattern).
* **Brand Header**: Centered `miniKast` bird icon and wordmark (`/logo-minikast.svg` or `/menucast-logo.svg`).
* **Card Container**:
  * Background: `#ffffff`
  * Border: `1px solid #b7eaed`
  * Border-radius: `16px` (`var(--fonts/font-sizes/s, 16px)`)
  * Padding: `24px` (`p-6`)
  * Drop shadow: `0px 1px 2px rgba(12, 12, 13, 0.05)`
  * Max width: `360px` to `400px` centered on viewport.

### 3.2 Form Elements & Typography
* **Typography**: Font family `Nunito` (`sans-serif`).
  * Card Title: Bold `20px` (`leading-6`), color `#0d1f21`.
  * Card Subtitle: Regular `14px` (`leading-4`), color `#547a7c`.
* **Input Fields**:
  * Height: `40px` (`h-10`)
  * Border: `1px solid #b7eaed`, border-radius `8px` (`rounded-lg`)
  * Background: `#ffffff`
  * Padding: `pl-4 pr-3 py-3`
  * Text & Placeholder: `16px` (`text-sm`), text `#0d1f21`, placeholder `#547a7c`
  * Focus State: `outline-none ring-2 ring-[#00878a]/30 border-[#00878a]`
* **Action Buttons & Links**:
  * **Primary CTA**: Background brand orange (`#f27200` / `#ff8000`), text `#ffffff`, font-bold, height `40px`, rounded-lg, hover: `brightness-105 active:scale-[0.99] transition-all`.
  * **Secondary Button (Login page)**: Border `1px solid #b7eaed`, background `#ffffff`, text `#0d1f21` / `#00878a`, height `40px`, rounded-lg, hover: `bg-neutral-50`.
  * **Subtle Links**: Color `#00878a` / `#547a7c`, text-sm, hover: `underline text-[#006e70]`.

---

## 4. Acceptance Criteria (Given / When / Then)

### AC-1: Login Page Flow (`/login`)
- **Given** an unauthenticated visitor navigating to `/login`,
- **When** the page renders,
- **Then** it presents the miniKast logo, "Sign In" title, "Welcome back to your dashboard" subtitle, Email and Password input fields, "Login" primary button, "Create Account" secondary button linking to `/register`, and "Forgot Password?" link leading to `/forgot-password`.
- **Given** valid credentials entered,
- **When** clicking "Login" (or pressing Enter),
- **Then** `signIn("credentials")` executes, sets session cookie, and redirects the user to the `callbackUrl` (defaulting to `/dashboard`).
- **Given** invalid email/password or unverified account,
- **When** authentication fails,
- **Then** an inline contextual error banner appears ("Invalid email or password") and form remains interactive.

### AC-2: Registration Page Flow (`/register`)
- **Given** a visitor navigating to `/register`,
- **When** the page renders,
- **Then** it presents the miniKast logo, "Create Account" title, subtitle, Email, Create Password, and Confirm Password inputs, primary "Create Account" CTA, and "Back to Login" link leading to `/login`.
- **Given** passwords do not match or password is $< 8$ characters,
- **When** submitting the form,
- **Then** client-side validation displays an error ("Passwords do not match" or "Password must be at least 8 characters") without sending network request.
- **Given** valid registration details,
- **When** clicking "Create Account",
- **Then** `POST /api/auth/register` creates the user in Supabase/PostgreSQL, auto-signs in the user, and redirects to `/dashboard`.
- **Given** an email that is already registered,
- **When** submitting the form,
- **Then** the API returns HTTP `409 Conflict` with error "An account with this email already exists" and prompts the user to log in.

### AC-3: Forgot Password Page Flow (`/forgot-password`)
- **Given** a user navigating to `/forgot-password`,
- **When** the page renders,
- **Then** it presents the miniKast logo, "Forgot Password" title, "Give us your email to find your account" subtitle, Email input, primary "Submit" CTA, and "Back to Login" link.
- **Given** a valid email submitted,
- **When** clicking "Submit",
- **Then** `POST /api/auth/forgot-password` triggers Supabase `auth.resetPasswordForEmail()` and transitions the card to a confirmation state: "Check your email — If an account exists, a password reset link has been sent."
- **When** clicking "Back to Login",
- **Then** user is navigated back to `/login`.

### AC-4: Loading States, Accessibility, and Security
- **Given** any form submission in progress,
- **When** the request is awaiting network response,
- **Then** input fields and buttons are disabled, submit button shows a spinner/loading copy ("Signing in...", "Creating account...", "Sending link..."), preventing duplicate submissions.
- **Given** screen reader and keyboard navigation,
- **When** tabbing through the forms,
- **Then** all inputs have matching `<label>` elements (or `aria-label`), visible focus outlines, and forms submit correctly on Enter key press.
- **Given** the monorepo build,
- **When** executing `pnpm build`,
- **Then** TypeScript compiles without errors.

---

## 5. Technical Implementation Plan & Code Map

### 5.1 Route & File Structure

```
apps/web/
├── app/
│   ├── login/
│   │   └── page.tsx            # [MODIFY] Redesigned Login UI matching node 1456:9079
│   ├── register/
│   │   └── page.tsx            # [MODIFY] Redesigned Register UI matching node 1456:9252
│   ├── forgot-password/
│   │   └── page.tsx            # [NEW] Forgot Password UI matching node 1468:7574
│   └── api/
│       └── auth/
│           ├── register/
│           │   └── route.ts    # [NEW] POST /api/auth/register endpoint
│           └── forgot-password/
│               └── route.ts    # [NEW] POST /api/auth/forgot-password endpoint
├── components/
│   └── auth/
│       └── auth-card-shell.tsx # [NEW] Reusable Auth Card container & mint backdrop
```

### 5.2 API Handlers

#### `POST /api/auth/register`
* Input: `{ email: string, password: string }`
* Validation: Email regex, password length $\ge 8$.
* Action: Uses Supabase admin client or client `supabase.auth.signUp()` / `admin.createUser({ email, password, email_confirm: true })`.
* Response: HTTP `201 Created` `{ success: true, user: { id, email } }` or HTTP `400 / 409` with descriptive message.

#### `POST /api/auth/forgot-password`
* Input: `{ email: string }`
* Action: Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })`.
* Response: HTTP `200 OK` `{ success: true }`.

---

## 6. Definition of Done (DoD)

- [x] All 3 screens (`/login`, `/register`, `/forgot-password`) visually match Figma node `1452:6196`.
- [x] Email/Password sign in successfully authenticates and redirects to `/dashboard`.
- [x] User registration provisions user in Supabase and auto logs in.
- [x] Password reset dispatches recovery link and displays confirmation message.
- [x] Client-side validation and server error messages render clearly.
- [x] `pnpm --filter @menucast/web build` succeeds with zero errors.
