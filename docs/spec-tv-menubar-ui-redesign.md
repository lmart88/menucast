---
title: 'TV Display Floating Menubar UI Redesign'
type: 'feature'
created: '2026-08-31'
status: 'approved'
figma_node: '1492:8284'
figma_url: 'https://www.figma.com/design/Em6ldktbhllCYZv9EUrR0b/miniKast?node-id=1492-8284'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/docs/prd.md'
  - '{project-root}/docs/epics.md'
  - '{project-root}/docs/sprint-plan.md'
  - '{project-root}/docs/spec-tv-pairing-ui-redesign.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a user interacts with the TV display player (`/tv`) during active menu playback (moving mouse or tapping screen), the top menubar overlay uses an earlier dark block prototype design that does not match the clean miniKast glassmorphic pill design system.

**Approach:** Redesign the floating top overlay bar in `apps/web/app/tv/page.tsx` to match the approved Figma design (`node-id=1492:8284`):
1. **Container**:
   - Translucent dark glassmorphism card (`bg-[#091516]/80 backdrop-blur-md`, `border border-[#304243]`, `rounded-[16px]`, `px-4 py-2.5`, `max-w-lg w-full`).
   - Smooth slide-in/fade animation when cursor movement or tap is detected (`translate-y-0 opacity-100` vs `-translate-y-6 opacity-0`).
2. **Left Header & Telemetry Summary**:
   - Title Row: "miniKast TV" (`14px font-bold text-white font-['Nunito']`) with a vibrant green live status indicator dot (`size-1.5 bg-[#00c04b]`).
   - Specs Subtitle Row: `{tvName} • {orientation} • {aspectRatio} • {resolution}` in light mint text (`12px font-normal text-[#b7eaed] font-['Nunito']`).
3. **Right Action Controls**:
   - Fullscreen Toggle Pill: Bordered white pill button (`border border-white/80 rounded-full px-3.5 py-1 text-xs font-bold text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors`).
   - Displays expand icon when windowed, or minimize icon when in fullscreen mode.
   - Preserves PWA install prompt button when running in installable browser environments.

## Boundaries & Constraints

**Always:**
- Keep existing mouse movement and touch watchdog (`showControls` auto-hiding after 3 seconds of inactivity).
- Retain keyboard shortcuts (`F` for Fullscreen toggle).
- Preserve hardware resolution and aspect ratio detection.

**Never:**
- Block or degrade 24/7 video/image playback performance.
- Cause layout shifts or flash artifacts over the live menu graphic.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| **MOUSE_MOVE / TOUCH** | User moves mouse or touches screen on `/tv` | Menubar slides down from top (`translate-y-0 opacity-100`) displaying brand title, live dot, screen telemetry specs, and Fullscreen pill | Auto-hides after 3s of idle |
| **FULLSCREEN_TOGGLE** | User clicks "Fullscreen" button or presses `F` | Dispatches `requestFullscreen()` or `exitFullscreen()` and toggles icon / label | Falls back if browser permissions block |
| **IDLE_TIMEOUT** | No pointer interaction for 3 seconds | Menubar smoothly animates out (`-translate-y-6 opacity-0`) and cursor hides (`cursor-none`) | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/app/tv/page.tsx` — TV display player component and floating overlay menubar.

## Acceptance Criteria

1. **Visual Fidelity**: Menubar matches Figma node `1492:8284` (translucent `#091516` glassmorphism, `#304243` border, `16px` rounded corners, `#b7eaed` telemetry row, and white pill Fullscreen CTA).
2. **Dynamic Telemetry**: Accurately displays `{tvName} • {orientation} • {aspectRatio} • {resolution}`.
3. **Responsive & Kiosk Friendly**: Works seamlessly on 1080p, 4K, landscape, and portrait TV displays.
