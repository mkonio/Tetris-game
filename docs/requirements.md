# MK Tetris — Requirements

## 1. Scope
A browser-based Tetris clone for learning purposes. Single player, no multiplayer, no server-side components.

### 1.1 In Scope (v1)
- Core Tetris gameplay (grid, tetrominoes, movement, rotation, line clearing)
- Scoring and level progression
- Start screen, game-over screen
- Keyboard controls

### 1.2 In Scope (v2)
- Ghost piece (landing preview)
- Next piece preview
- Pause/resume
- Key bindings display in UI
- Half-speed level progression (relaxed pace)
- Renamed to MK Tetris

### 1.3 Out of Scope (current)
- Hold piece
- Hard drop (instant placement)
- Sound effects and animations
- Mobile/touch controls
- High score persistence

> Out-of-scope items may be added in future versions.

## 2. Functional Requirements

### 2.1 Game Board
- FR-01: Grid is 10 columns × 20 rows
- FR-02: Each cell is either empty or occupied by a locked block with a color
- FR-03: Grid state updates after every piece lock and line clear

### 2.2 Tetrominoes
- FR-04: 7 standard pieces — I, O, T, S, Z, J, L
- FR-05: Each piece has a distinct color
- FR-06: Pieces spawn at the top-center of the grid
- FR-07: Pieces descend automatically at the current level speed
- FR-08: Player can move the falling piece left, right, or down
- FR-09: Player can rotate the falling piece clockwise
- FR-10: Pieces lock in place when they cannot descend further

### 2.3 Collision Detection
- FR-11: Pieces cannot move through the grid walls (left, right, bottom)
- FR-12: Pieces cannot overlap with locked blocks
- FR-13: Rotation is blocked if the result would overlap walls or locked blocks

### 2.4 Line Clearing
- FR-14: A completely filled row is cleared from the grid
- FR-15: Multiple rows can be cleared simultaneously (up to 4)
- FR-16: Rows above a cleared row shift down to fill the gap

### 2.5 Scoring
- FR-17: Points awarded per line clear: 1 line = 100, 2 = 300, 3 = 500, 4 = 800 (multiplied by current level)
- FR-18: Score is displayed and updates in real time

### 2.6 Levels and Speed
- FR-19: Game starts at level 1
- FR-20: Level increases every 10 lines cleared
- FR-21: Piece drop speed increases with each level
- FR-22: Current level and total lines cleared are displayed

### 2.7 Game States and Screens
- FR-23: Start screen — shows game title, "Press Start" prompt
- FR-24: Playing state — active gameplay with score/level display
- FR-25: Game over — triggered when a new piece cannot spawn without overlapping
- FR-26: Game over screen — shows final score, option to restart

### 2.8 Controls
- FR-27: Left/Right arrow keys — move piece horizontally
- FR-28: Down arrow key — accelerate piece descent (soft drop)
- FR-29: Up arrow key — rotate piece clockwise
- FR-30: Enter/Space — start game / restart after game over

### 2.9 Ghost Piece (v2)
- FR-31: A semi-transparent "ghost" of the active piece is shown at its landing position
- FR-32: Ghost updates instantly when the player moves or rotates the piece
- FR-33: Ghost is not drawn when the piece is already at the landing position

### 2.10 Next Piece Preview (v2)
- FR-34: A preview panel shows the next piece that will spawn
- FR-35: Preview updates after each piece spawn
- FR-36: Preview displays the piece centered in its own canvas, using the piece's color

### 2.11 Pause/Resume (v2)
- FR-37: Player can pause the game by pressing P or Escape
- FR-38: While paused, gameplay freezes — no piece movement, no input except unpause
- FR-39: Pause screen overlays the board with "PAUSED" text and resume instructions
- FR-40: Pressing P or Escape while paused resumes gameplay

### 2.12 Key Bindings Display (v2)
- FR-41: The UI panel displays all key bindings (move, rotate, soft drop, pause, start)

### 2.13 Speed (v2)
- FR-42: Drop speeds are halved compared to classic NES Tetris (doubled frame intervals) for a more relaxed pace

## 3. Non-Functional Requirements
- NFR-01: Runs in any modern browser (Chrome, Firefox, Edge, Safari)
- NFR-02: No external game engines or heavyweight frameworks
- NFR-03: No server-side dependencies — pure client-side
- NFR-04: Responsive to keyboard input with no perceptible lag
- NFR-05: Codebase under 2000 lines total
- NFR-06: Code is readable and well-commented (learning project)

## 4. Future Versions (Backlog)

### 4.1 Level-Up Target Area + Hidden Photo (custom mechanic)
- BL-01: A hidden photo is loaded at game start, mapped to the grid dimensions
- BL-02: The photo is fully covered at the start — the player cannot see it
- BL-03: Each level has a randomly generated "target area" — a region of cells that must be filled to complete the level
- BL-04: The target area is visually distinct (highlighted/outlined) so the player knows what to fill
- BL-05: Target area size increases with each level (e.g., level 1 = small region, level 5 = larger region)
- BL-06: Level changes when the target area is completely filled, regardless of lines cleared
- BL-07: When a level is completed, the corresponding target area is "revealed" — the cover is removed and the hidden photo shows through for those cells
- BL-08: Lines are cleared normally — if a cleared line passes through the target area, that progress is lost and those cells must be filled again
- BL-09: This creates a deliberate score-vs-progress tension: clearing lines earns points but can undo target area progress
- BL-10: A new random target area is generated at the start of each level, covering a still-hidden portion of the photo
- BL-11: Completing all levels reveals the full photo — acts as a win condition beyond endless play
- BL-12: Photos can be bundled as a set or loaded from a configurable source

### 4.2 Mobile App (see decisions.md D-04)
- BL-13: Package game as native mobile app via Capacitor (iOS/Android)
- BL-14: Add touch input handler — tap zones or swipe gestures for move/rotate/drop
- BL-15: Responsive layout adapts to mobile screen sizes and orientations

### 4.3 Backend — Photo Library + Statistics (see decisions.md D-05)
- BL-16: REST API to serve photos for the hidden photo mechanic (replaces local/bundled photos)
- BL-17: API endpoint to submit game statistics on game over (score, level, lines, duration)
- BL-18: Player statistics dashboard — personal history, averages, best scores
- BL-19: Photo management — admin can upload/manage the photo library via API
- BL-20: API authentication — player identity for statistics tracking

### 4.4 Other Backlog Items
- Hold piece mechanic
- Hard drop (instant placement)
- Sound effects and line-clear animations
- High score persistence (localStorage initially, then via API)
