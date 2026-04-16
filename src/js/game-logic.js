// ============================================================
// MK Tetris — Pure Game Logic (no DOM, no Canvas)
// ============================================================
// Extracted for testability. These functions operate on data only.
// ============================================================

// --- Constants ---
const COLUMNS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 2;
const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

const PIECE_COLORS = {
    I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000',
    Z: '#f00000', J: '#0000f0', L: '#f0a000'
};

const POINTS_PER_LINES = { 1: 100, 2: 300, 3: 500, 4: 800 };

// --- Tetromino Definitions (FR-04, D-06) ---
const TETROMINOES = {
    I: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    ],
    O: [
        [[1,1],[1,1]], [[1,1],[1,1]], [[1,1],[1,1]], [[1,1],[1,1]]
    ],
    T: [
        [[0,1,0],[1,1,1],[0,0,0]], [[0,1,0],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,1],[0,1,0]], [[0,1,0],[1,1,0],[0,1,0]]
    ],
    S: [
        [[0,1,1],[1,1,0],[0,0,0]], [[0,1,0],[0,1,1],[0,0,1]],
        [[0,0,0],[0,1,1],[1,1,0]], [[1,0,0],[1,1,0],[0,1,0]]
    ],
    Z: [
        [[1,1,0],[0,1,1],[0,0,0]], [[0,0,1],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,0],[0,1,1]], [[0,1,0],[1,1,0],[1,0,0]]
    ],
    J: [
        [[1,0,0],[1,1,1],[0,0,0]], [[0,1,1],[0,1,0],[0,1,0]],
        [[0,0,0],[1,1,1],[0,0,1]], [[0,1,0],[0,1,0],[1,1,0]]
    ],
    L: [
        [[0,0,1],[1,1,1],[0,0,0]], [[0,1,0],[0,1,0],[0,1,1]],
        [[0,0,0],[1,1,1],[1,0,0]], [[1,1,0],[0,1,0],[0,1,0]]
    ]
};

// --- Board ---
function createBoard() {
    const board = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
        board.push(new Array(COLUMNS).fill(0));
    }
    return board;
}

// --- Collision Detection (FR-11, FR-12, FR-13) ---
function isValidPosition(board, matrix, row, col) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                const boardRow = row + r;
                const boardCol = col + c;

                if (boardCol < 0 || boardCol >= COLUMNS || boardRow >= TOTAL_ROWS) {
                    return false;
                }
                if (boardRow < 0) continue;
                if (board[boardRow][boardCol] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// --- Piece Locking (FR-10) ---
function lockPiece(board, piece) {
    const matrix = piece.matrix;
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] === 1) {
                const boardRow = piece.row + r;
                const boardCol = piece.col + c;
                if (boardRow >= 0 && boardRow < TOTAL_ROWS) {
                    board[boardRow][boardCol] = piece.color;
                }
            }
        }
    }
}

// --- Line Clearing (FR-14, FR-15, FR-16) ---
function clearLines(board) {
    let linesCleared = 0;
    for (let row = TOTAL_ROWS - 1; row >= 0; row--) {
        const isFullRow = board[row].every(cell => cell !== 0);
        if (isFullRow) {
            linesCleared++;
            board.splice(row, 1);
            board.unshift(new Array(COLUMNS).fill(0));
            row++;
        }
    }
    return linesCleared;
}

// --- Scoring (FR-17) ---
function calculateScore(linesCleared, level) {
    return (POINTS_PER_LINES[linesCleared] || 0) * level;
}

// --- Level Calculation (FR-20) ---
function calculateLevel(totalLinesCleared) {
    return Math.floor(totalLinesCleared / 10) + 1;
}

// --- Drop Speed (FR-21) ---
// Speeds are doubled (slower) compared to classic NES Tetris for a more relaxed pace
function getDropInterval(level) {
    const speeds = [96, 86, 76, 66, 56, 46, 36, 26, 16, 12, 10, 10, 10, 8, 8, 8, 6, 6, 6, 4];
    const index = Math.min(level - 1, speeds.length - 1);
    return speeds[index];
}

// --- Ghost Piece (drop projection) ---
function getGhostRow(board, matrix, row, col) {
    let ghostRow = row;
    while (isValidPosition(board, matrix, ghostRow + 1, col)) {
        ghostRow++;
    }
    return ghostRow;
}

// --- Hard Drop Score (FR-46) ---
// Awards 2 points per row dropped
function calculateHardDropScore(currentRow, ghostRow) {
    return Math.max(0, (ghostRow - currentRow) * 2);
}

// --- Bag System (D-04) ---
function generateBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
}

// --- Exports for testing ---
// In browser context, attach to window so tests can access them
if (typeof window !== 'undefined') {
    window.TetrisLogic = {
        COLUMNS, ROWS, HIDDEN_ROWS, TOTAL_ROWS,
        PIECE_COLORS, POINTS_PER_LINES, TETROMINOES,
        createBoard, isValidPosition, lockPiece, clearLines,
        calculateScore, calculateLevel, getDropInterval,
        getGhostRow, calculateHardDropScore, generateBag
    };
}
