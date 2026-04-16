// ============================================================
// MK Tetris — Main Entry Point
// ============================================================
// Uses game-logic.js for pure logic functions (loaded before this file).
// This file handles: canvas rendering, input, game loop, UI, layout.
//
// Functions and constants from game-logic.js are available as globals:
//   COLUMNS, ROWS, HIDDEN_ROWS, TOTAL_ROWS, PIECE_COLORS, TETROMINOES,
//   POINTS_PER_LINES, createBoard, isValidPosition, lockPiece, clearLines,
//   calculateScore, calculateLevel, getDropInterval, getGhostRow,
//   calculateHardDropScore, generateBag
// ============================================================

// --- Rendering Constants ---
const GRID_LINE_COLOR = '#1a1a3e';
const GRID_BG_COLOR = '#0f0f23';
const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 30;

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

const previewCanvas = document.getElementById('preview-canvas');
const previewContext = previewCanvas.getContext('2d');

const holdCanvas = document.getElementById('hold-canvas');
const holdContext = holdCanvas.getContext('2d');

// --- Dynamic Sizing (FR-47 to FR-50, D-10) ---
let cellSize = MAX_CELL_SIZE;
let previewCellSize = 24;

function calculateCellSize() {
    const isMobileLayout = window.innerWidth < 600;
    const dpr = window.devicePixelRatio || 1;

    let availWidth, availHeight;

    if (isMobileLayout) {
        // Portrait: canvas takes full width, leave room for UI + touch controls below
        const padding = 16;
        availWidth = window.innerWidth - (padding * 2);
        // Reserve space: ~160px for stats row, ~140px for touch controls, ~40px margins
        availHeight = window.innerHeight - 340;
    } else {
        // Desktop: canvas on left, UI panel on right
        const padding = 48;
        availWidth = window.innerWidth * 0.6 - padding;
        availHeight = window.innerHeight - padding;
    }

    // Calculate max cell size that maintains the 1:2 aspect ratio
    const byWidth = Math.floor(availWidth / COLUMNS);
    const byHeight = Math.floor(availHeight / ROWS);
    cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, byWidth, byHeight));

    // Scale preview cells proportionally
    previewCellSize = Math.max(10, Math.floor(cellSize * 0.8));

    // Set canvas logical size
    canvas.width = COLUMNS * cellSize;
    canvas.height = ROWS * cellSize;

    // Set preview/hold canvas sizes
    const previewSize = previewCellSize * 5;
    previewCanvas.width = previewSize;
    previewCanvas.height = previewSize;
    holdCanvas.width = previewSize;
    holdCanvas.height = previewSize;
}

function handleResize() {
    calculateCellSize();
    // Force a re-render on next frame
}

// Debounced resize handler
let resizeTimer = null;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 100);
});
window.addEventListener('orientationchange', function() {
    setTimeout(handleResize, 200);
});

// Initial sizing
calculateCellSize();

// --- Game State ---
const board = createBoard();
const pieceSequence = [];
let activePiece = null;
let score = 0;
let level = 1;
let totalLinesCleared = 0;
let dropCounter = 0;
let gameState = 'start';  // 'start', 'playing', 'paused', 'gameover'

// --- Hold Piece State (FR-59 to FR-63) ---
let heldPieceType = null;
let holdUsedThisTurn = false;

// --- Piece Spawning (FR-06) ---
function ensureBagHasPieces() {
    if (pieceSequence.length < 2) {
        pieceSequence.unshift(...generateBag());
    }
}

function spawnPiece() {
    ensureBagHasPieces();

    const type = pieceSequence.pop();
    const matrix = TETROMINOES[type][0];
    const col = Math.floor(COLUMNS / 2) - Math.ceil(matrix[0].length / 2);

    activePiece = {
        type: type,
        rotation: 0,
        matrix: matrix,
        row: 0,
        col: col,
        color: PIECE_COLORS[type]
    };

    // Reset hold flag for new piece
    holdUsedThisTurn = false;

    // Ensure there's always a next piece to preview
    ensureBagHasPieces();
}

function getNextPieceType() {
    return pieceSequence.length > 0 ? pieceSequence[pieceSequence.length - 1] : null;
}

// --- Renderer ---

function drawCell(col, visibleRow, color) {
    const x = col * cellSize;
    const y = visibleRow * cellSize;

    context.fillStyle = color;
    context.fillRect(x, y, cellSize, cellSize);

    context.strokeStyle = GRID_LINE_COLOR;
    context.lineWidth = 1;
    context.strokeRect(x, y, cellSize, cellSize);
}

function drawBoard() {
    context.fillStyle = GRID_BG_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = HIDDEN_ROWS; row < TOTAL_ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const visibleRow = row - HIDDEN_ROWS;
            const cellValue = board[row][col];
            drawCell(col, visibleRow, cellValue !== 0 ? cellValue : GRID_BG_COLOR);
        }
    }
}

function drawActivePiece() {
    if (!activePiece) return;

    const matrix = activePiece.matrix;
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 1) {
                const boardRow = activePiece.row + row;
                const boardCol = activePiece.col + col;

                if (boardRow >= HIDDEN_ROWS) {
                    drawCell(boardCol, boardRow - HIDDEN_ROWS, activePiece.color);
                }
            }
        }
    }
}

// --- Ghost Piece Renderer ---
function drawGhostPiece() {
    if (!activePiece) return;

    const ghostRow = getGhostRow(board, activePiece.matrix, activePiece.row, activePiece.col);
    if (ghostRow === activePiece.row) return;

    const matrix = activePiece.matrix;
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 1) {
                const boardRow = ghostRow + row;
                const boardCol = activePiece.col + col;

                if (boardRow >= HIDDEN_ROWS) {
                    const visibleRow = boardRow - HIDDEN_ROWS;
                    const x = boardCol * cellSize;
                    const y = visibleRow * cellSize;

                    context.strokeStyle = activePiece.color;
                    context.globalAlpha = 0.3;
                    context.fillStyle = activePiece.color;
                    context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    context.globalAlpha = 1.0;
                    context.lineWidth = 1;
                    context.strokeRect(x, y, cellSize, cellSize);
                }
            }
        }
    }
}

// --- Preview Drawing (shared by Next and Hold) ---
function drawPreviewPiece(ctx, canvasEl, pieceType) {
    ctx.fillStyle = GRID_BG_COLOR;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    if (!pieceType) return;

    const matrix = TETROMINOES[pieceType][0];
    const color = PIECE_COLORS[pieceType];

    const pieceWidth = matrix[0].length * previewCellSize;
    const pieceHeight = matrix.length * previewCellSize;
    const offsetX = Math.floor((canvasEl.width - pieceWidth) / 2);
    const offsetY = Math.floor((canvasEl.height - pieceHeight) / 2);

    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 1) {
                const x = offsetX + col * previewCellSize;
                const y = offsetY + row * previewCellSize;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, previewCellSize, previewCellSize);
                ctx.strokeStyle = GRID_LINE_COLOR;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, previewCellSize, previewCellSize);
            }
        }
    }
}

function drawNextPiecePreview() {
    drawPreviewPiece(previewContext, previewCanvas, getNextPieceType());
}

function drawHoldPiecePreview() {
    drawPreviewPiece(holdContext, holdCanvas, heldPieceType);
}

// --- Screen Renderers ---

function drawStartScreen() {
    context.fillStyle = GRID_BG_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#00d4ff';
    context.font = 'bold ' + Math.max(20, Math.floor(cellSize * 1.2)) + 'px Courier New';
    context.textAlign = 'center';
    context.fillText('MK TETRIS', canvas.width / 2, canvas.height / 2 - 40);

    context.fillStyle = '#888';
    context.font = Math.max(12, Math.floor(cellSize * 0.5)) + 'px Courier New';
    context.fillText('Press ENTER to start', canvas.width / 2, canvas.height / 2 + 20);
}

function drawGameOverScreen() {
    drawBoard();

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#f00000';
    context.font = 'bold ' + Math.max(18, Math.floor(cellSize * 1.1)) + 'px Courier New';
    context.textAlign = 'center';
    context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    context.fillStyle = '#ffffff';
    context.font = Math.max(14, Math.floor(cellSize * 0.6)) + 'px Courier New';
    context.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);

    context.fillStyle = '#888';
    context.font = Math.max(11, Math.floor(cellSize * 0.47)) + 'px Courier New';
    context.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 50);
}

function drawPauseScreen() {
    drawBoard();

    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#f0f000';
    context.font = 'bold ' + Math.max(18, Math.floor(cellSize * 1.1)) + 'px Courier New';
    context.textAlign = 'center';
    context.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

    context.fillStyle = '#888';
    context.font = Math.max(11, Math.floor(cellSize * 0.47)) + 'px Courier New';
    context.fillText('Press P or ESC to resume', canvas.width / 2, canvas.height / 2 + 20);
}

// --- UI Updates (FR-18, FR-22) ---
function updateUI() {
    document.getElementById('score-display').textContent = score;
    document.getElementById('level-display').textContent = level;
    document.getElementById('lines-display').textContent = totalLinesCleared;
}

// --- Game Actions ---

function handleLineClear() {
    const lines = clearLines(board);
    if (lines > 0) {
        score += calculateScore(lines, level);
        totalLinesCleared += lines;
        level = calculateLevel(totalLinesCleared);
        updateUI();
    }
}

function checkGameOver() {
    if (!isValidPosition(board, activePiece.matrix, activePiece.row, activePiece.col)) {
        gameState = 'gameover';
        return true;
    }
    return false;
}

// --- Hard Drop (FR-43 to FR-46) ---
function performHardDrop() {
    if (!activePiece || gameState !== 'playing') return;

    const ghostRow = getGhostRow(board, activePiece.matrix, activePiece.row, activePiece.col);
    score += calculateHardDropScore(activePiece.row, ghostRow);
    activePiece.row = ghostRow;

    // Lock immediately
    lockPiece(board, activePiece);
    handleLineClear();
    spawnPiece();
    if (checkGameOver()) {
        drawGameOverScreen();
        return;
    }
    dropCounter = 0;
    updateUI();
}

// --- Hold Piece (FR-59 to FR-63) ---
function performHold() {
    if (!activePiece || gameState !== 'playing' || holdUsedThisTurn) return;

    const currentType = activePiece.type;

    if (heldPieceType === null) {
        // No piece held yet — stash current, spawn next
        heldPieceType = currentType;
        spawnPiece();
    } else {
        // Swap held piece with active piece
        const swapType = heldPieceType;
        heldPieceType = currentType;

        const matrix = TETROMINOES[swapType][0];
        const col = Math.floor(COLUMNS / 2) - Math.ceil(matrix[0].length / 2);

        activePiece = {
            type: swapType,
            rotation: 0,
            matrix: matrix,
            row: 0,
            col: col,
            color: PIECE_COLORS[swapType]
        };
    }

    holdUsedThisTurn = true;
    dropCounter = 0;
}

function resetGame() {
    for (let row = 0; row < TOTAL_ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            board[row][col] = 0;
        }
    }
    score = 0;
    level = 1;
    totalLinesCleared = 0;
    dropCounter = 0;
    pieceSequence.length = 0;
    activePiece = null;
    heldPieceType = null;
    holdUsedThisTurn = false;
    updateUI();
    spawnPiece();
    gameState = 'playing';
}

// --- Input Handler (FR-27 to FR-30, FR-43, FR-63) ---
document.addEventListener('keydown', function(event) {
    // Start/restart — Enter only (Space is now hard drop)
    if (event.key === 'Enter') {
        if (gameState === 'start' || gameState === 'gameover') {
            resetGame();
        }
        return;
    }

    // Pause toggle (Escape or P)
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
        if (gameState === 'playing') {
            gameState = 'paused';
            return;
        } else if (gameState === 'paused') {
            gameState = 'playing';
            return;
        }
    }

    // Gameplay input — blocked when not playing
    if (!activePiece || gameState !== 'playing') return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) {
        event.preventDefault();
    }

    switch (event.key) {
        case 'ArrowLeft':
            if (isValidPosition(board, activePiece.matrix, activePiece.row, activePiece.col - 1)) {
                activePiece.col--;
            }
            break;

        case 'ArrowRight':
            if (isValidPosition(board, activePiece.matrix, activePiece.row, activePiece.col + 1)) {
                activePiece.col++;
            }
            break;

        case 'ArrowDown':
            if (isValidPosition(board, activePiece.matrix, activePiece.row + 1, activePiece.col)) {
                activePiece.row++;
                dropCounter = 0;
            }
            break;

        case 'ArrowUp': {
            const nextRotation = (activePiece.rotation + 1) % 4;
            const nextMatrix = TETROMINOES[activePiece.type][nextRotation];
            if (isValidPosition(board, nextMatrix, activePiece.row, activePiece.col)) {
                activePiece.rotation = nextRotation;
                activePiece.matrix = nextMatrix;
            }
            break;
        }

        case ' ':
            performHardDrop();
            break;

        case 'c':
        case 'C':
            performHold();
            break;
    }
});

// --- Touch Controls (FR-51 to FR-55, D-09) ---
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

function setupTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    if (!isTouchDevice) {
        touchControls.style.display = 'none';
        return;
    }

    touchControls.style.display = 'grid';

    // Map button IDs to game actions
    const buttonActions = {
        'btn-left': function() { executeGameAction('left'); },
        'btn-right': function() { executeGameAction('right'); },
        'btn-down': function() { executeGameAction('down'); },
        'btn-rotate': function() { executeGameAction('rotate'); },
        'btn-hard-drop': function() { executeGameAction('hardDrop'); },
        'btn-hold': function() { executeGameAction('hold'); },
        'btn-pause': function() { executeGameAction('pause'); }
    };

    // Hold-to-repeat for directional buttons
    const repeatButtons = ['btn-left', 'btn-right', 'btn-down'];
    let repeatTimer = null;
    let repeatInterval = null;

    for (const [id, action] of Object.entries(buttonActions)) {
        const btn = document.getElementById(id);
        if (!btn) continue;

        const isRepeatable = repeatButtons.includes(id);

        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            action();

            if (isRepeatable) {
                // Start repeating after 200ms, then every 80ms
                repeatTimer = setTimeout(function() {
                    repeatInterval = setInterval(action, 80);
                }, 200);
            }
        }, { passive: false });

        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(repeatTimer);
            clearInterval(repeatInterval);
            repeatTimer = null;
            repeatInterval = null;
        }, { passive: false });

        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            clearTimeout(repeatTimer);
            clearInterval(repeatInterval);
            repeatTimer = null;
            repeatInterval = null;
        }, { passive: false });
    }

    // Also handle start/restart via tap on canvas when on start/gameover screen
    canvas.addEventListener('touchstart', function(e) {
        if (gameState === 'start' || gameState === 'gameover') {
            e.preventDefault();
            resetGame();
        }
    }, { passive: false });
}

function executeGameAction(action) {
    if (action === 'pause') {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
        return;
    }

    if (!activePiece || gameState !== 'playing') return;

    switch (action) {
        case 'left':
            if (isValidPosition(board, activePiece.matrix, activePiece.row, activePiece.col - 1)) {
                activePiece.col--;
            }
            break;
        case 'right':
            if (isValidPosition(board, activePiece.matrix, activePiece.row, activePiece.col + 1)) {
                activePiece.col++;
            }
            break;
        case 'down':
            if (isValidPosition(board, activePiece.matrix, activePiece.row + 1, activePiece.col)) {
                activePiece.row++;
                dropCounter = 0;
            }
            break;
        case 'rotate': {
            const nextRotation = (activePiece.rotation + 1) % 4;
            const nextMatrix = TETROMINOES[activePiece.type][nextRotation];
            if (isValidPosition(board, nextMatrix, activePiece.row, activePiece.col)) {
                activePiece.rotation = nextRotation;
                activePiece.matrix = nextMatrix;
            }
            break;
        }
        case 'hardDrop':
            performHardDrop();
            break;
        case 'hold':
            performHold();
            break;
    }
}

// Initialize touch controls
setupTouchControls();

// --- Game Loop (D-03) ---
function gameLoop() {
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'gameover') {
        drawGameOverScreen();
    } else if (gameState === 'paused') {
        drawPauseScreen();
    } else if (gameState === 'playing') {
        dropCounter++;
        if (dropCounter >= getDropInterval(level)) {
            dropCounter = 0;

            if (isValidPosition(board, activePiece.matrix, activePiece.row + 1, activePiece.col)) {
                activePiece.row++;
            } else {
                lockPiece(board, activePiece);
                handleLineClear();
                spawnPiece();
                if (checkGameOver()) {
                    drawGameOverScreen();
                    requestAnimationFrame(gameLoop);
                    return;
                }
            }
        }

        drawBoard();
        drawGhostPiece();
        drawActivePiece();
        drawNextPiecePreview();
        drawHoldPiecePreview();
    }

    requestAnimationFrame(gameLoop);
}

// --- Start ---
console.log('MK Tetris game loaded.');
gameLoop();
