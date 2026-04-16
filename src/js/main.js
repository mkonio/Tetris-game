// ============================================================
// Tetris Game — Main Entry Point
// ============================================================
// Uses game-logic.js for pure logic functions (loaded before this file).
// This file handles: canvas rendering, input, game loop, UI.
//
// Functions and constants from game-logic.js are available as globals:
//   COLUMNS, ROWS, HIDDEN_ROWS, TOTAL_ROWS, PIECE_COLORS, TETROMINOES,
//   POINTS_PER_LINES, createBoard, isValidPosition, lockPiece, clearLines,
//   calculateScore, calculateLevel, getDropInterval, generateBag
// ============================================================

// --- Rendering Constants ---
const CELL_SIZE = 30;
const GRID_LINE_COLOR = '#1a1a3e';
const GRID_BG_COLOR = '#0f0f23';

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
canvas.width = COLUMNS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

// --- Game State ---
const board = createBoard();
const pieceSequence = [];
let activePiece = null;
let score = 0;
let level = 1;
let totalLinesCleared = 0;
let dropCounter = 0;
let gameState = 'start';  // 'start', 'playing', 'gameover'

// --- Piece Spawning (FR-06) ---
function spawnPiece() {
    if (pieceSequence.length === 0) {
        pieceSequence.push(...generateBag());
    }

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
}

// --- Renderer ---

function drawCell(col, visibleRow, color) {
    const x = col * CELL_SIZE;
    const y = visibleRow * CELL_SIZE;

    context.fillStyle = color;
    context.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    context.strokeStyle = GRID_LINE_COLOR;
    context.lineWidth = 1;
    context.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
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

function drawStartScreen() {
    context.fillStyle = GRID_BG_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#00d4ff';
    context.font = 'bold 36px Courier New';
    context.textAlign = 'center';
    context.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 40);

    context.fillStyle = '#888';
    context.font = '16px Courier New';
    context.fillText('Press ENTER to start', canvas.width / 2, canvas.height / 2 + 20);
}

function drawGameOverScreen() {
    drawBoard();

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#f00000';
    context.font = 'bold 32px Courier New';
    context.textAlign = 'center';
    context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    context.fillStyle = '#ffffff';
    context.font = '18px Courier New';
    context.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);

    context.fillStyle = '#888';
    context.font = '14px Courier New';
    context.fillText('Press ENTER to restart', canvas.width / 2, canvas.height / 2 + 50);
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
    updateUI();
    spawnPiece();
    gameState = 'playing';
}

// --- Input Handler (FR-27 to FR-30) ---
document.addEventListener('keydown', function(event) {
    // Start/restart
    if (event.key === 'Enter' || event.key === ' ') {
        if (gameState === 'start' || gameState === 'gameover') {
            resetGame();
        }
        return;
    }

    // Gameplay input
    if (!activePiece || gameState !== 'playing') return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
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
    }
});

// --- Game Loop (D-03) ---
function gameLoop() {
    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'gameover') {
        drawGameOverScreen();
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
                    // Don't render the overlapping piece — go straight to game over
                    drawGameOverScreen();
                    requestAnimationFrame(gameLoop);
                    return;
                }
            }
        }

        drawBoard();
        drawActivePiece();
    }

    requestAnimationFrame(gameLoop);
}

// --- Start ---
console.log('Tetris game loaded.');
gameLoop();
