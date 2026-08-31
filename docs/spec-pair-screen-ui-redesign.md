---
title: 'Pair New TV Page UI Redesign'
type: 'feature'
created: '2026-08-31'
status: 'approved'
figma_node: '1459:10712'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1459-10712'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
  - '{project-root}/docs/spec-tv-pairing-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current `/pair` page uses a legacy dark prototype theme (`bg-neutral-950`) that is inconsistent with the rest of the redesigned miniKast brand experience (light mint radial background, centered card, clean typography, and vibrant orange CTA).

**Approach:** Redesign the `/pair` page (`apps/web/app/pair/page.tsx`) to match the approved Figma design (`node-id=1459:10712`):
1. **Atmosphere**: Light cyan/mint radial backdrop (`#f7fcfc` to `#b7eaed`) with subtle dot pattern grid.
2. **Brand Header**: Centered `miniKast` logo/wordmark (`h-8`, `w-auto`).
3. **Card Container**:
   - Floating white card (`bg-white`, `border 1px solid #b7eaed`, `rounded-2xl` (`16px`), `p-6`, max-w-sm / `304px` width, soft shadow).
4. **Header inside Card**:
   - Title: "Pair New TV" (`20px`, bold `#0d1f21`, `Nunito`).
   - Subtitle: "Link a new TV to your account to push and manage live menu designs remotely." (`14px`, regular `#547a7c`, `Nunito`).
5. **Code Confirmation Pill & Input**:
   - If a code is passed in URL (`?code=WORD-1234`), display the floating confirmation pill (`border 1px solid #b7eaed`, `rounded-2xl`, `px-4 py-2`) showing "Confirm Code" on left in `#547a7c` and the formatted code in bold teal `#008996` (`20px`) on right.
   - If no code is present in URL, provide an editable input field to type the code.
6. **TV Name Input Field**:
   - Label: "TV Name" (`14px font-normal text-[var(--foreground)]`).
   - Input: `h-[40px]`, `border 1px solid #b7eaed`, `rounded-lg`, `px-4 py-2`, text `14px`, placeholder `Enter TV Name`.
7. **Primary Action Button**:
   - "Pair TV" CTA in brand orange (`bg-[#f27200] hover:bg-[#ff8000] text-white font-bold h-[40px] rounded-full text-sm w-full`).
8. **Auth & State Handling**:
   - Unauthenticated visitors are redirected to `/login?callbackUrl=/pair?code=...`.
   - Loading, success, and error states match the light theme design system.

## Boundaries & Constraints

**Always:**
- Use Next.js App Router (`apps/web/app/pair/page.tsx`) with React 19 and Tailwind CSS.
- Preserve session authentication check and callback URL forwarding.
- Preserve `POST /api/tv/pair` API contract (`{ pairing_code, tv_name }`).
- Redirect to `/dashboard` upon successful pairing.

**Never:**
- Remove error handling or code validation safeguards.
- Break QR code deep-links from `/tv` (`/pair?code=<CODE>`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **URL_WITH_CODE** | User visits `/pair?code=BARK-2874` authenticated | Displays "Confirm Code" pill with `BARK -2874` prefilled, TV Name input, and "Pair TV" button | Shows inline error if code invalid |
| **MANUAL_ENTRY** | User visits `/pair` without query param | Renders editable Pairing Code input + TV Name input | Validates non-empty before submit |
| **UNAUTHENTICATED** | Visitor opens `/pair?code=XYZ` | Redirects to `/login?callbackUrl=/pair?code=XYZ` | Preserves code parameter across auth flow |
| **PAIRING_SUCCESS** | User clicks "Pair TV" and API succeeds | Displays success checkmark with smooth redirect to `/dashboard` | Fallback button to manual dashboard navigation |
| **INVALID_EXPIRED_CODE** | Pairing code already claimed or expired | Displays inline error banner with "Try Again" option | Clear actionable error copy |

</frozen-after-approval>

## Code Map

- `apps/web/app/pair/page.tsx` — Client pairing form component.
- `apps/web/app/globals.css` — Global styling and background classes.

## Acceptance Criteria

1. **Visual Accuracy**: `/pair` strictly matches Figma frame `1459:10712` on desktop and mobile viewports.
2. **Code Pre-population**: URL query param `?code=...` displays formatted confirm code pill.
3. **Session Preservation**: Unauthenticated users are redirected to login and returned with code intact.
4. **Reliable Pairing**: Submitting "Pair TV" calls `/api/tv/pair`, updates Postgres, and triggers TV realtime broadcast.
