// ============================================================
// Tetris Game — Main Entry Point
// ============================================================
// Uses game-logic.js for pure logic functions (loaded before this file).
// This file handles: canvas rendering, input, game loop, UI.
//
// Functions and constants from game-logic.js are available as globals:
//   COLUMNS, ROWS, HIDDEN_ROWS, TOTAL_ROWS, PIECE_COLORS, TETROMINOES,
//   POINTS_PER_LINES, createBoard, isValidPosition, lockPiece, clearLines,
//   calculateScore, calculateLevel, getDropInterval, getGhostRow, generateBag
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

const previewCanvas = document.getElementById('preview-canvas');
const previewContext = previewCanvas.getContext('2d');
const PREVIEW_CELL_SIZE = 24;

// --- Game State ---
const board = createBoard();
const pieceSequence = [];
let activePiece = null;
let score = 0;
let level = 1;
let totalLinesCleared = 0;
let dropCounter = 0;
let gameState = 'start';  // 'start', 'playing', 'paused', 'gameover'

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

    // Ensure there's always a next piece to preview
    ensureBagHasPieces();
}

function getNextPieceType() {
    return pieceSequence.length > 0 ? pieceSequence[pieceSequence.length - 1] : null;
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

// --- Ghost Piece Renderer ---
function drawGhostPiece() {
    if (!activePiece) return;

    const ghostRow = getGhostRow(board, activePiece.matrix, activePiece.row, activePiece.col);
    // Don't draw if ghost is at the same position as the active piece
    if (ghostRow === activePiece.row) return;

    const matrix = activePiece.matrix;
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 1) {
                const boardRow = ghostRow + row;
                const boardCol = activePiece.col + col;

                if (boardRow >= HIDDEN_ROWS) {
                    const visibleRow = boardRow - HIDDEN_ROWS;
                    const x = boardCol * CELL_SIZE;
                    const y = visibleRow * CELL_SIZE;

                    // Draw semi-transparent outline
                    context.strokeStyle = activePiece.color;
                    context.globalAlpha = 0.3;
                    context.fillStyle = activePiece.color;
                    context.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    context.globalAlpha = 1.0;
                    context.lineWidth = 1;
                    context.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }
}

// --- Next Piece Preview ---
function drawNextPiecePreview() {
    previewContext.fillStyle = GRID_BG_COLOR;
    previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    const nextType = getNextPieceType();
    if (!nextType) return;

    const matrix = TETROMINOES[nextType][0];
    const color = PIECE_COLORS[nextType];

    // Center the piece in the preview canvas
    const pieceWidth = matrix[0].length * PREVIEW_CELL_SIZE;
    const pieceHeight = matrix.length * PREVIEW_CELL_SIZE;
    const offsetX = Math.floor((previewCanvas.width - pieceWidth) / 2);
    const offsetY = Math.floor((previewCanvas.height - pieceHeight) / 2);

    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 1) {
                const x = offsetX + col * PREVIEW_CELL_SIZE;
                const y = offsetY + row * PREVIEW_CELL_SIZE;
                previewContext.fillStyle = color;
                previewContext.fillRect(x, y, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
                previewContext.strokeStyle = GRID_LINE_COLOR;
                previewContext.lineWidth = 1;
                previewContext.strokeRect(x, y, PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE);
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
    context.fillText('MK TETRIS', canvas.width / 2, canvas.height / 2 - 40);

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

function drawPauseScreen() {
    drawBoard();

    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#f0f000';
    context.font = 'bold 32px Courier New';
    context.textAlign = 'center';
    context.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

    context.fillStyle = '#888';
    context.font = '14px Courier New';
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
                    // Don't render the overlapping piece — go straight to game over
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
    }

    requestAnimationFrame(gameLoop);
}

// --- Start ---
console.log('Tetris game loaded.');
gameLoop();
