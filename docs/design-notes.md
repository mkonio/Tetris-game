# MK Tetris — Design Notes

## 1. Architecture Pattern

Layered architecture with clear separation of concerns:

```
┌─────────────────────────────────┐
│         Input Handler           │  Captures keyboard events
├─────────────────────────────────┤
│         Game State Machine      │  Controls flow: Start → Playing → Game Over
├─────────────────────────────────┤
│         Game Logic              │  Board, pieces, collision, scoring, levels
├─────────────────────────────────┤
│         Renderer                │  Draws game state to screen
└─────────────────────────────────┘
```

**Why this pattern:** Keeps game logic testable without rendering. Renderer can be swapped (Canvas, DOM, etc.) without touching game rules. Input is decoupled — easy to add touch controls later.

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

## 6. Scalability Path

The architecture is designed so that v1 works standalone, but future features slot in without restructuring:

```
v1 (browser, standalone)          Future additions
─────────────────────────         ──────────────────────────
Input Handler (keyboard)    →     + Touch Input Handler (BL-14)
Game Logic (pure JS)        →     unchanged
Renderer (Canvas)           →     + Photo Layer, Cover/Mask Layer (BL-01–BL-12)
                                  + API Client module (BL-16–BL-20)
Web app (open index.html)   →     + Capacitor wrapper for mobile (BL-13)
```

### 6.1 What we build now with the future in mind
- **No framework lock-in:** Pure JS modules, portable anywhere
- **No browser-only APIs in game logic:** Game logic operates on data structures, not DOM/Canvas directly — keeps it testable and portable
- **Renderer is read-only:** Adding a photo layer or mask layer later means extending the renderer, not rewriting it
- **Input handler is decoupled:** Adding touch controls = adding a new input handler that emits the same commands

### 6.2 What we intentionally defer
- No API client code until backend exists
- No touch input until mobile version is scoped
- No photo/mask rendering until the target area mechanic is designed in detail

## 7. Future Design Considerations

### 7.1 Target Area + Hidden Photo (BL-01 to BL-12)
Will require:
- A photo layer behind/beneath the game grid
- A cover/mask layer that tracks which cells are revealed vs hidden
- Target area generation algorithm (random region, scaled by level)
- Conflict handling: line clears that intersect the target area reset that progress (BL-08, BL-09)
- Win condition: all areas revealed = game complete (BL-11)

### 7.2 Mobile App (BL-13 to BL-15)
Will require:
- Capacitor project setup wrapping the existing web app
- Touch input handler (swipe/tap gestures mapped to game commands)
- Responsive Canvas scaling for varying screen sizes
- Testing on actual devices

### 7.3 Backend API (BL-16 to BL-20)
Will require:
- API client module added to the game (fetch photos, post statistics)
- REST endpoints: GET photos, POST game results, GET player stats
- Database schema for players, game sessions, scores
- Photo storage (cloud bucket, served via API)
- Authentication layer for player identity

Each of these will get their own detailed design document when entering scope.
