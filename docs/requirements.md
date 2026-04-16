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

### 1.3 In Scope (v3)
- Responsive canvas — scales to fit any screen while maintaining aspect ratio
- Touch controls — on-screen buttons for mobile play
- Hard drop — instant placement (prerequisite for usable mobile play)
- Mobile viewport — prevent zoom, prevent scroll during gameplay
- Hold piece (stretch goal — natural pairing with new controls)

### 1.4 Out of Scope (current)
- Sound effects and animations
- High score persistence
- Capacitor native app packaging (deferred — browser mobile-first)

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
- FR-30: Enter — start game / restart after game over (Note: Space was removed as start/restart in v3 to avoid conflict with hard drop — see FR-44)

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

### 2.14 Hard Drop (v3)
- FR-43: Player can instantly drop the active piece to its ghost position and lock it
- FR-44: Hard drop is triggered by Space key on keyboard
- FR-45: Hard drop locks the piece immediately — no lock delay
- FR-46: Score awards 2 points per row dropped via hard drop (standard Tetris scoring)

### 2.15 Responsive Canvas (v3)
- FR-47: Game canvas scales to fit the viewport while maintaining 1:2 aspect ratio (10×20 grid)
- FR-48: UI panel repositions below the canvas on narrow screens (portrait/mobile)
- FR-49: Canvas re-scales on window resize and orientation change
- FR-50: Cell size is calculated dynamically from available space — no fixed pixel size on mobile

### 2.16 Touch Controls (v3)
- FR-51: On-screen control buttons appear on touch-capable devices
- FR-52: Touch buttons for: left, right, rotate, soft drop, hard drop, hold, pause
- FR-53: Touch buttons are hidden on desktop (keyboard-only devices)
- FR-54: Touch buttons are large enough for comfortable thumb tapping (minimum 44×44px per Apple HIG)
- FR-55: Touch input calls `preventDefault()` to block browser scroll/zoom during gameplay

### 2.17 Mobile Viewport (v3)
- FR-56: Viewport meta tag prevents user scaling and sets width to device-width
- FR-57: CSS disables text selection, touch callouts, and overscroll on the game container
- FR-58: Game fills available screen height on mobile — no wasted space above/below

### 2.18 Hold Piece (v3 — stretch goal)
- FR-59: Player can stash the active piece into a "hold" slot and receive the next piece instead
- FR-60: If a piece is already held, pressing hold swaps the active piece with the held piece
- FR-61: Hold can only be used once per piece drop — flag resets after the next piece spawns
- FR-62: Hold piece is displayed in a dedicated panel in the UI (similar to next piece preview)
- FR-63: Hold is triggered by C key on keyboard, or a dedicated touch button on mobile

## 3. Non-Functional Requirements
- NFR-01: Runs in any modern browser (Chrome, Firefox, Edge, Safari) on desktop and mobile
- NFR-02: No external game engines or heavyweight frameworks
- NFR-03: No server-side dependencies — pure client-side
- NFR-04: Responsive to keyboard and touch input with no perceptible lag
- NFR-05: Codebase under 2000 lines total
- NFR-06: Code is readable and well-commented (learning project)
- NFR-07: Playable on screens as small as 375px wide (iPhone SE) in portrait orientation (v3)
- NFR-08: Touch targets meet minimum 44×44px accessibility guideline (v3)

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

### 4.2 Native Mobile App (see decisions.md D-04)
- BL-13: Package game as native mobile app via Capacitor (iOS/Android) — deferred until browser mobile is proven
- BL-14: (Moved to v3 — FR-51 to FR-55)
- BL-15: (Moved to v3 — FR-47 to FR-50)

### 4.3 Backend — Photo Library + Statistics (see decisions.md D-05)
- BL-16: REST API to serve photos for the hidden photo mechanic (replaces local/bundled photos)
- BL-17: API endpoint to submit game statistics on game over (score, level, lines, duration)
- BL-18: Player statistics dashboard — personal history, averages, best scores
- BL-19: Photo management — admin can upload/manage the photo library via API
- BL-20: API authentication — player identity for statistics tracking

### 4.4 Other Backlog Items
- Sound effects and line-clear animations
- High score persistence (localStorage initially, then via API)
