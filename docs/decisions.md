# MK Tetris — Decisions Log

## D-01: Tech Stack — Vanilla HTML/CSS/JS + Canvas

**Date:** 2026-04-16
**Status:** Decided

### Decision
Use vanilla HTML, CSS, and JavaScript with HTML5 Canvas for game rendering. No frameworks, no build tools.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **HTML/CSS/JS + Canvas** | No build tools, beginner-friendly, runs by opening index.html, standard for browser games, direct path to mobile via Capacitor | No built-in state management, manual DOM handling for UI |
| React + Canvas | Modern patterns, component model, state management | Build tooling required (Vite/Webpack), heavier for a small game, steeper learning curve |
| Python + Pygame | Good for desktop games, strong language | Not browser-based, no mobile path without rewrite, requires Python install |

### Rationale
- **Beginner-friendly:** No npm, no bundlers, no transpilers. Open `index.html` and it works.
- **Mobile path stays open:** Vanilla JS wraps directly into Capacitor for native iOS/Android — no rewrite needed.
- **Backend path stays open:** When photos/statistics are added later, the game calls a REST API. The game code itself barely changes — just add an API client module.
- **No lock-in:** No framework-specific patterns. If we ever need React or another framework, the game logic modules port cleanly because they're pure JS with no framework dependencies.
- **Industry standard:** Canvas is the recommended rendering approach for browser-based games. DOM elements used only for UI (menus, score display).

### Consequences
- Manual state management (no Redux/Zustand) — acceptable for this scope
- Testing will use vanilla JS assertions or a lightweight test runner
- CSS kept minimal — game visuals are Canvas-drawn

---

## D-02: Architecture — Layered with Separated Concerns

**Date:** 2026-04-16
**Status:** Decided

### Decision
Layered architecture: Input Handler → Game State Machine → Game Logic → Renderer. Each layer is a separate JS module.

### Rationale
- Game logic is testable without a browser (pure functions operating on data)
- Renderer is read-only — never modifies game state
- Input handler sends commands, doesn't move pieces directly
- Adding a backend API later = adding one new module (API client), no restructuring
- Adding mobile touch controls later = adding one input handler, game logic untouched

---

## D-03: Game Loop — requestAnimationFrame with Frame Counter

**Date:** 2026-04-16
**Status:** Decided

### Decision
Use `requestAnimationFrame` for the game loop. Piece auto-descent controlled by a frame counter, not `setInterval`.

### Rationale
- Stays in sync with browser refresh rate
- Avoids timing bugs from independent timers
- Frame counter threshold decreases per level = natural speed increase
- Pausing the game = stop the loop, no orphaned timers

---

## D-04: Mobile Strategy — Capacitor (future)

**Date:** 2026-04-16
**Status:** Planned (not yet needed)

### Decision
When mobile version is needed, wrap the existing web app using Capacitor to produce native iOS/Android apps from the same codebase.

### Rationale
- Capacitor officially supports vanilla JS — no framework migration needed
- Single codebase for web + mobile
- Native device features (camera, storage) accessible via Capacitor plugins
- Alternative: PWA for lighter mobile support without app store distribution

### Prerequisites
- Game must remain a clean web app (no desktop-only APIs)
- Touch input handler must be added (backlog item)

---

## D-05: Backend Strategy — REST API + Database (future)

**Date:** 2026-04-16
**Status:** Planned (not yet needed)

### Decision
When photos and statistics features are needed, add a backend API layer. Candidate stack: Node.js/Express + PostgreSQL + cloud storage for photos.

### Rationale
- Node.js/Express: same language as frontend (JavaScript end-to-end), beginner-friendly, lightweight
- PostgreSQL: strong for analytics/statistics queries, structured data
- Cloud storage (e.g., S3 or equivalent): photos stored separately from database, scalable
- REST API: simple request/response pattern, no WebSocket complexity needed for this use case

### Impact on Current Design
- Game modules remain unchanged — add a thin API client module that fetches photos and posts statistics
- Photo layer in the target area mechanic reads from API instead of local assets
- Statistics module collects gameplay data and sends to API on game over

---

## D-07: Drop Speed — Half-Speed (Relaxed Pace)

**Date:** 2026-04-16
**Status:** Decided

### Decision
Double all NES Tetris drop intervals (level 1: 48→96 frames, level 20: 2→4 frames) for a more relaxed gameplay pace.

### Rationale
- The game is a learning project, not a competitive Tetris clone — accessibility matters more than tournament-level speed
- Classic NES speeds feel punishing for casual play, especially at higher levels
- The relative speed curve is preserved — each level still feels noticeably faster than the previous one
- Easy to revert or make configurable later if a "classic speed" option is desired

### Consequences
- Level 1 test updated from 48 to 96 frames expectation
- Higher levels remain challenging but more playable (level 10 = 12 frames instead of 6)

---

## D-08: Ghost Piece — Drop Projection via Pure Function

**Date:** 2026-04-16
**Status:** Decided

### Decision
Implement ghost piece as a pure function `getGhostRow()` in game-logic.js that projects the active piece downward until collision. Renderer draws the ghost as a semi-transparent fill at the projected position.

### Rationale
- Pure function keeps the ghost piece testable without rendering — consistent with the layered architecture (D-02)
- Reuses existing `isValidPosition()` for projection — no new collision logic needed
- Semi-transparent rendering (30% alpha fill + full-opacity outline) gives clear visual feedback without obscuring the board
- Ghost is recalculated every frame, so it always reflects the current piece position — no state synchronization needed

### Consequences
- Adds ~8 lines to game-logic.js, ~30 lines to main.js renderer
- Ghost draw happens before active piece draw so the solid piece always renders on top
- `getGhostRow` exported to window.TetrisLogic for testability

---

## D-09: Touch Controls — Buttons Over Swipe Gestures

**Date:** 2026-04-16
**Status:** Decided

### Decision
Use on-screen tap buttons for mobile touch controls rather than swipe gestures.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Tap buttons** | Discrete actions, no ambiguity, immediate response, accessible, matches official Tetris Mobile | Buttons take screen space, less "natural" feel |
| Swipe gestures | No visible UI clutter, feels native on mobile | Ambiguous diagonals, misinterpretation risk, poor for rapid repeated inputs (e.g., 3× left), continuous finger contact required |
| Hybrid (swipe + buttons) | Flexible, user choice | Complex implementation, confusing UX, harder to test |

### Rationale
- Research shows swipe gestures have a fundamental ambiguity problem for grid-based games — a slightly diagonal swipe gets misinterpreted as the wrong direction
- Rapid repeated moves (left-left-left) require lifting and re-swiping, which is slower than tapping a button 3 times
- Official Tetris Mobile uses buttons as the primary control scheme, validating this approach
- Buttons are DOM elements — they get native touch feedback, accessibility support, and CSS styling for free
- Buttons can be shown/hidden based on device capability detection, keeping the desktop experience clean

### Consequences
- Touch buttons are hidden on desktop via `'ontouchstart' in window` detection
- Button area consumes ~120px of screen height on mobile — layout must account for this
- All touch handlers use `touchstart` (not `click`) to avoid the ~300ms mobile click delay
- Left/right buttons support hold-to-repeat at ~100ms intervals for smooth movement

### Sources
- [MDN: Mobile touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch)
- [Tetris Mobile official controls](https://playstudios.helpshift.com/hc/en/16-tetris-mobile/faq/2944-tetris-controls/)
- [Touch Control Design — Mobile Free To Play](https://mobilefreetoplay.com/touch-control-design-less-is-more/)

---

## D-10: Responsive Canvas — Dynamic Cell Sizing

**Date:** 2026-04-16
**Status:** Decided

### Decision
Calculate `CELL_SIZE` dynamically from available viewport space instead of using a fixed 30px value. Canvas dimensions are derived from cell size × grid dimensions.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Dynamic cell size** | Works at any resolution, sharp on all screens, no horizontal scroll on small phones | Slightly more complex rendering setup, must recalculate on resize |
| CSS transform scaling | Simple — scale a fixed canvas with CSS | Blurry on non-integer scales, doesn't help with layout reflow |
| Fixed canvas + scroll | Zero effort | Terrible mobile UX, unusable |

### Rationale
- The game grid has a fixed aspect ratio (1:2 for 10×20), so fitting it to any screen is just a matter of finding the largest cell size that fits
- CSS transform scaling causes blurriness because the canvas bitmap is stretched — dynamic sizing keeps the canvas crisp at native resolution
- `window.devicePixelRatio` is used to render at the display's native resolution while keeping CSS dimensions at logical size
- A `resize` event listener (debounced) handles window resizing and orientation changes
- Layout switches from row (desktop) to column (mobile portrait) via CSS flexbox and a media query at 600px breakpoint

### Consequences
- `CELL_SIZE` is no longer a constant — it's recalculated on init and resize
- `PREVIEW_CELL_SIZE` is also derived proportionally
- All drawing functions already use `CELL_SIZE` as a multiplier, so the rendering code changes are minimal
- Canvas width/height attributes and CSS dimensions are set separately for DPI support

### Sources
- [Responsive HTML5 Canvas — DEV Community](https://dev.to/georgedoescode/html5-canvas-responsive-2keh)
- [Scaling HTML5 Canvas — Code Theory](https://codetheory.in/scaling-your-html5-canvas-to-fit-different-viewports-or-resolutions/)
- [Auto-Resizing HTML5 Games — web.dev](https://web.dev/case-studies/gopherwoord-studios-resizing-html5-games)

---

## D-11: Browser Mobile-First, Defer Capacitor

**Date:** 2026-04-16
**Status:** Decided

### Decision
Implement mobile support as a responsive browser experience first. Defer Capacitor native packaging until the browser mobile version is stable and proven.

### Rationale
- A responsive web app is immediately testable on any phone — no build pipeline, no app store, no provisioning profiles
- Capacitor adds build complexity (npm, node_modules, platform SDKs, Xcode/Android Studio) that isn't justified until we know the mobile game plays well
- If the browser mobile experience is good enough, Capacitor may not even be needed — the game can be saved as a PWA or home screen shortcut
- All Capacitor requires is a working web app — building a good one first means the Capacitor wrapper is trivial when the time comes
- This is consistent with the project's "no premature optimization" principle (CLAUDE.md)

### Consequences
- No npm or build tooling added in v3 — the game remains "open index.html to play"
- Mobile testing is done in browser DevTools (device emulation) and on real phones via local network or file sharing
- Capacitor remains in the backlog (BL-13) for future consideration
