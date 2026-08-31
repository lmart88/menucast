---
title: 'TV Display Paired Idle Screen UI Redesign'
type: 'feature'
created: '2026-08-31'
status: 'approved'
figma_node: '1485:2350'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1485-2350'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
  - '{project-root}/docs/spec-tv-pairing-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a TV display is successfully paired but has not yet received its first pushed menu, it renders a legacy dark-themed placeholder screen (`bg-neutral-950`) that clashes with the miniKast brand aesthetic and the newly redesigned pairing screen.

**Approach:** Redesign the TV display's paired idle state (`apps/web/app/tv/page.tsx`) to match the approved Figma design (`node-id=1485:2350`):
1. **Atmosphere**: Light cyan/mint radial backdrop (`#f7fcfc` to `#b7eaed`) with subtle dot pattern grid, seamlessly continuing the visual theme from the pairing screen.
2. **Success Checkmark Container**:
   - Centered `131px` x `131px` badge (`bg-[#f7fcfc]`, `border-4 border-[#008996]`, `24px` border radius).
   - High-contrast green checkmark icon (`#00c04b` / `#008996`).
3. **Heading**:
   - Bold "TV Paired!" heading (`32px`, `#0d1f21`, `Nunito`).
4. **"Next Step" Action Card**:
   - Floating card container (`w-[311px]`, `bg-white`, `border 1px solid #b7eaed`, `16px` border-radius, `16px` padding, text-center).
   - "Next Step" label in bold teal `#008996` (`16px`, `font-bold`).
   - Instruction copy: "Open the miniKast dashboard, upload your design, and publish it!" in `#547a7c` (`16px`, `leading-5`).
5. **Real-time Status Indicator**:
   - Soft pulsing live indicator dot (`#00c04b` green).
   - Label: "Listening for live updates..." in `#547a7c` (`16px`).

## Boundaries & Constraints

**Always:**
- Use the existing Next.js App Router setup in `apps/web/app/tv/page.tsx` and Tailwind CSS.
- Maintain responsive layout across all standard TV resolutions (1080p, 4K, 720p, landscape, and portrait).
- Keep real-time Supabase WebSocket listener (`tv:<TV_ID>` channel) active so new menu pushes immediately trigger smooth crossfading transitions.
- Preserve 24/7 wake-lock, reboot persistence, and fullscreen capabilities.

**Never:**
- Alter real-time broadcast contracts (`menu:push`, `menu:clear`, `tv:unpaired`).
- Add heavy assets or blocking dependencies that degrade low-power TV performance (Fire TV Sticks).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **PAIRING_SUCCESS** | User pairs TV from mobile / dashboard | TV receives `tv:paired` event and transitions seamlessly into the redesigned "TV Paired!" idle screen | Auto-reconnects on network drop |
| **AWAITING_PUSH** | TV is paired with no active menu URL | Renders mint backdrop, success checkmark card, "Next Step" instructions, and pulsing live listener indicator | Real-time channel remains subscribed |
| **FIRST_MENU_PUSH** | Designer pushes menu from Figma or Dashboard | TV receives `menu:push` payload and transitions with 800ms double-buffered crossfade to the live menu | Error banner fallback if image fails to load |
| **DEVICE_REBOOT** | Paired TV restarts without active menu | Reads stored state and enters redesigned "TV Paired!" idle screen | Auto-initializes watchdog |

</frozen-after-approval>

## Code Map

- `apps/web/app/tv/page.tsx` — TV display player component handling pairing, paired idle state, and live menu rendering.
- `apps/web/app/globals.css` — Theme variables, typography, and atmospheric background patterns.

## Acceptance Criteria

1. **Visual Match (`node-id=1485:2350`)**: The paired idle screen strictly aligns with Figma frame `1485:2350` (mint radial gradient, teal checkmark container, "TV Paired!" title, Next Step card, and live status indicator).
2. **Seamless Transition**: Transition from pairing screen to paired idle screen is smooth with no layout shifts.
3. **Instant Live Push**: Image pushed via Supabase Realtime replaces the idle screen with zero black-screen flashes.
4. **Performance & Reliability**: Low memory footprint ($< 120$MB RAM) and responsive across all TV screen aspect ratios (16:9 Landscape & 9:16 Portrait).
