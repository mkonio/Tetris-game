# Tetris Game — Decisions Log

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
