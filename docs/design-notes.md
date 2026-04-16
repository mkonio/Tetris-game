# MK Tetris — Design Notes

## 1. Architecture Pattern

Layered architecture with clear separation of concerns:

```
┌─────────────────────────────────┐
│  Input Handler (keyboard+touch) │  Captures keyboard & touch events
├─────────────────────────────────┤
│         Game State Machine      │  Controls flow: Start → Playing → Paused → Game Over
├─────────────────────────────────┤
│         Game Logic              │  Board, pieces, collision, scoring, levels
├─────────────────────────────────┤
│     Renderer (responsive)       │  Draws game state to scaled canvas
├─────────────────────────────────┤
│     Layout Manager (v3)         │  Scales canvas, repositions UI for viewport
└─────────────────────────────────┘
```

**Why this pattern:** Keeps game logic testable without rendering. Renderer can be swapped (Canvas, DOM, etc.) without touching game rules. Input is decoupled — keyboard and touch handlers emit the same commands. Layout Manager handles responsive scaling independently of game logic.

## 2. Core Modules

### 2.1 Game State Machine
Manages transitions between screens (maps to FR-23 through FR-26, FR-37 through FR-40):

```
[Start Screen] --press start--> [Playing] --piece can't spawn--> [Game Over]
     ^                             |   ^                              |
     │                          P/Esc  P/Esc                          │
     │                             v   |                              │
     │                          [Paused]                              │
     └────────────────────press restart───────────────────────────────┘
```

### 2.2 Board
- 2D array: 10 columns × 20 rows, plus 2 hidden rows above for spawning (FR-01, FR-02)
- Each cell stores: empty (0) or piece color identifier
- Responsible for: locking pieces, detecting full rows, clearing lines, shifting rows down (FR-14 to FR-16)

### 2.3 Tetromino
- Each piece defined as a 2D matrix representing its shape (FR-04)
- Properties: type, color, rotation state, row, col (grid position)
- Spawns at top-center of grid (FR-06)
- Rotation = swap to next rotation matrix (FR-09)

### 2.4 Collision Detection
- Check before every move/rotation: is the new position valid? (FR-11 to FR-13)
- Validates against: grid boundaries (walls, floor) and locked blocks
- Single function: `isValidMove(piece, board, newRow, newCol, newMatrix)`

### 2.5 Scoring & Levels
- Score calculated on line clear: points × level multiplier (FR-17)
- Level advances every 10 lines cleared (FR-19 to FR-21)
- Drop speed tied to level — faster as levels increase

### 2.6 Ghost Piece (v2 — FR-31 to FR-33)
- Pure logic function `getGhostRow(board, matrix, row, col)` in game-logic.js
- Projects the active piece downward until collision — returns the landing row
- Renderer draws ghost as semi-transparent fill (30% opacity) with a full-opacity outline
- Ghost is not drawn when piece is already at landing position (avoids visual clutter)
- Ghost updates automatically because it's recalculated every render frame

### 2.7 Next Piece Preview (v2 — FR-34 to FR-36)
- Separate 120×120 canvas (`preview-canvas`) in the UI panel
- `getNextPieceType()` peeks at the last item in the piece sequence without removing it
- `ensureBagHasPieces()` guarantees at least 2 pieces in the bag at all times so there's always a next piece to preview
- Preview draws the piece centered in the canvas using 24px cells
- Redrawn every frame during gameplay

### 2.8 Input Handler
- Listens for keyboard events (FR-27 to FR-30, FR-37 to FR-40)
- Maps keys to actions: moveLeft, moveRight, moveDown, rotate, start/restart, pause/resume
- P and Escape toggle between 'playing' and 'paused' states
- All gameplay input is blocked when game state is not 'playing'
- Does NOT move pieces directly — sends commands to Game Logic
- Decoupled so touch/gamepad support can be added later (backlog)

### 2.9 Renderer
- Reads game state and draws it to screen
- Responsibilities: draw grid, draw ghost piece, draw active piece, draw locked blocks, draw next piece preview, draw UI (score, level, lines), draw pause/game-over overlays
- Draw order during gameplay: board → ghost piece → active piece → preview (ghost drawn first so active piece renders on top)
- Draw loop synced to browser refresh via `requestAnimationFrame`
- Renderer never modifies game state — read-only

### 2.10 Hard Drop (v3 — FR-43 to FR-46)
- Pure logic function `hardDrop(board, piece)` in game-logic.js — reuses `getGhostRow()` to find landing position
- Moves piece instantly to ghost row, locks immediately (no lock delay)
- Awards 2 points per row dropped (distance between current row and ghost row)
- Triggered by Space key on keyboard, dedicated touch button on mobile
- Space key is reassigned from start/restart — Enter becomes the sole start/restart key

### 2.11 Responsive Canvas (v3 — FR-47 to FR-50)

**Scaling strategy:** Calculate `CELL_SIZE` dynamically from available viewport space rather than using a fixed 30px. The game grid aspect ratio (1:2) is always preserved.

```
On resize / orientation change:
  1. Measure available space (viewport minus UI margins)
  2. Calculate max cell size that fits: min(availWidth / COLUMNS, availHeight / ROWS)
  3. Resize canvas: width = cellSize × COLUMNS, height = cellSize × ROWS
  4. Re-render immediately
```

**Layout modes:**
- **Desktop (wide viewport):** Canvas left, UI panel right (current layout)
- **Mobile portrait (narrow viewport, < 600px):** Canvas on top, UI panel + touch controls below. CSS flexbox switches from `row` to `column` direction.

**Device pixel ratio:** Canvas internal resolution is multiplied by `window.devicePixelRatio` for sharp rendering on high-DPI screens, while CSS dimensions match the logical size. Context is scaled accordingly.

**Resize handling:** A single `resize` event listener (debounced) recalculates cell size, resizes canvas, and triggers a re-render. The `orientationchange` event is also handled for mobile rotation.

### 2.12 Touch Controls (v3 — FR-51 to FR-55)

**Approach: on-screen buttons (not gestures)**

Based on research, tap buttons are more reliable than swipe gestures for Tetris:
- Swipe gestures have ambiguity (is a diagonal swipe a move or a drop?)
- Swipe requires continuous finger contact — awkward for rapid left/left/left moves
- Buttons provide clear, discrete actions with no misinterpretation
- Official Tetris Mobile uses buttons as primary control scheme

**Button layout:**
```
┌─────────────────────────────────────┐
│          [  GAME CANVAS  ]          │
│                                     │
├─────────────────────────────────────┤
│  Next / Hold / Score / Level / Lines│
├─────────────────────────────────────┤
│                                     │
│   [ ◀ ]   [ ▶ ]      [ ⟳ ]  [HOLD]│
│         [ ▼ ]        [ ⏬ ] [PAUSE]│
│                                     │
└─────────────────────────────────────┘
```
Left cluster: directional (left, right, soft drop). Right cluster: actions (rotate, hard drop, hold, pause).

**Implementation:**
- Buttons are DOM elements (not canvas-drawn) — benefits from native touch feedback, accessibility, and CSS styling
- CSS grid or flexbox layout for the button area
- Each button dispatches the same game commands as keyboard — no separate code path for touch vs keyboard
- Buttons are shown/hidden based on touch capability detection: `'ontouchstart' in window || navigator.maxTouchPoints > 0`
- All touch handlers call `event.preventDefault()` to block scroll/zoom
- Minimum touch target size: 44×44px (Apple Human Interface Guidelines)

**Touch event handling:**
- Use `touchstart` (not `click`) for immediate response — `click` has ~300ms delay on mobile
- Use `touchend` to detect release
- For soft drop: `touchstart` begins rapid descent, `touchend` stops it
- Repeat-on-hold for left/right: when button is held, trigger repeated moves at ~100ms intervals

### 2.13 Mobile Viewport (v3 — FR-56 to FR-58)

**Meta tags:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**CSS protections:**
```css
body {
    touch-action: none;          /* Prevent browser gestures */
    -webkit-user-select: none;   /* Prevent text selection */
    user-select: none;
    overscroll-behavior: none;   /* Prevent pull-to-refresh */
}
```

**Fullscreen:** On mobile, the game should use all available vertical space. Use `100dvh` (dynamic viewport height) to account for browser chrome that appears/disappears on scroll.

### 2.14 Hold Piece (v3 stretch goal — FR-59 to FR-63)

**State:**
- `heldPiece`: stores the type of the held piece (or null)
- `holdUsedThisTurn`: boolean flag, resets to false when a new piece spawns

**Logic (pure function in game-logic.js):**
- If no piece is held: stash active piece type, spawn next piece from bag
- If a piece is held: swap active piece with held piece, reset position to spawn point
- Set `holdUsedThisTurn = true` — prevents infinite swapping

**UI:**
- Hold piece displayed in a preview canvas, identical in style to the "Next" preview
- Positioned above or below the "Next" preview in the UI panel
- On mobile: shown in the stats bar between canvas and touch controls

## 3. Game Loop

```
requestAnimationFrame loop:
  1. Process input (buffered key states)
  2. Update game state:
     - Move piece down (based on timer/level speed)
     - Apply player input (move, rotate)
     - Check collisions
     - Lock piece if landed
     - Clear full lines
     - Update score/level
     - Spawn next piece or trigger game over
  3. Render current state to screen
```

**Timing:** Piece auto-descends based on a frame counter, not a separate timer. Counter threshold decreases as level increases = faster drop.

## 4. Data Structures

### 4.1 Board Grid
```
board[row][col] = 0 | 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
```
Row 0 = top (hidden spawn area), Row 21 = bottom.

### 4.2 Tetromino Definitions
Each piece stored as array of rotation matrices. Example (T-piece):
```
rotations[0] = [[0,1,0],    rotations[1] = [[1,0],
                [1,1,1],                     [1,1],
                [0,0,0]]                     [1,0]]
... etc for all 4 rotations
```

### 4.3 Piece Sequence
Random bag system: shuffle all 7 pieces, deal them in order, reshuffle when bag is empty. Guarantees all pieces appear before any repeats.

## 5. Key Design Decisions

All decisions are logged with full rationale in `docs/decisions.md`.

| # | Decision | Reference |
|---|----------|-----------|
| D-01 | Vanilla HTML/CSS/JS + Canvas | decisions.md D-01 |
| D-02 | Layered architecture | decisions.md D-02 |
| D-03 | requestAnimationFrame + frame counter | decisions.md D-03 |
| D-04 | Random bag piece generation | Standard Tetris Guideline — prevents long droughts of needed pieces |
| D-05 | 2 hidden rows above grid | Allows pieces to spawn off-screen and descend naturally |
| D-06 | Rotation via matrix lookup (not math) | Pre-defined rotation states are simpler and avoid rotation bugs |
| D-07 | Half-speed drop intervals | decisions.md D-07 |
| D-08 | Ghost piece via projection | decisions.md D-08 |
| D-09 | Touch buttons over swipe gestures | decisions.md D-09 |
| D-10 | Dynamic cell sizing for responsive canvas | decisions.md D-10 |
| D-11 | Browser mobile-first, defer Capacitor | decisions.md D-11 |

## 6. Scalability Path

The architecture is designed so that v1 works standalone, but future features slot in without restructuring:

```
v1-v2 (browser, keyboard)         v3 (browser, mobile)              Future
─────────────────────────         ──────────────────────────        ──────────────────
Input Handler (keyboard)    →     + Touch Input Handler              unchanged
Game Logic (pure JS)        →     + hardDrop(), holdPiece()          + Photo mechanic
Renderer (Canvas, fixed)    →     Responsive (dynamic cell size)     + Photo/Mask layers
Static layout               →     + Layout Manager (flex reflow)     unchanged
Web app (desktop browser)   →     + Mobile browser (viewport/CSS)    + Capacitor (BL-13)
                                                                     + API Client (BL-16–BL-20)
```

### 6.1 What we build now with the future in mind
- **No framework lock-in:** Pure JS modules, portable anywhere
- **No browser-only APIs in game logic:** Game logic operates on data structures, not DOM/Canvas directly — keeps it testable and portable
- **Renderer is read-only:** Adding a photo layer or mask layer later means extending the renderer, not rewriting it
- **Input handler is decoupled:** Keyboard and touch handlers emit the same commands — game logic doesn't know or care which input source is active
- **Dynamic sizing (v3):** Cell size is calculated, not hardcoded — works at any resolution, which directly benefits the Capacitor path later

### 6.2 What we intentionally defer
- No Capacitor packaging until browser mobile is proven and stable
- No API client code until backend exists
- No photo/mask rendering until the target area mechanic is designed in detail

## 7. Future Design Considerations

### 7.1 Target Area + Hidden Photo (BL-01 to BL-12)
Will require:
- A photo layer behind/beneath the game grid
- A cover/mask layer that tracks which cells are revealed vs hidden
- Target area generation algorithm (random region, scaled by level)
- Conflict handling: line clears that intersect the target area reset that progress (BL-08, BL-09)
- Win condition: all areas revealed = game complete (BL-11)

### 7.2 Native Mobile App (BL-13 — deferred)
Browser mobile support (touch controls, responsive canvas) is handled in v3. Capacitor packaging for native app stores will require:
- Capacitor project setup wrapping the existing web app
- Build pipeline for iOS/Android
- App store configuration and assets (icons, splash screens)
- Testing on actual devices
- Prerequisites: v3 browser mobile must be stable first

### 7.3 Backend API (BL-16 to BL-20)
Will require:
- API client module added to the game (fetch photos, post statistics)
- REST endpoints: GET photos, POST game results, GET player stats
- Database schema for players, game sessions, scores
- Photo storage (cloud bucket, served via API)
- Authentication layer for player identity

Each of these will get their own detailed design document when entering scope.
