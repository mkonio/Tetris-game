// ============================================================
// Tetris Game Logic — Unit Tests
// ============================================================
// Tests pure game logic functions from game-logic.js
// Covers: board, collision, line clearing, scoring, levels, bag
// ============================================================

const T = TestRunner;
const G = window.TetrisLogic;

// ===================
// Board Creation
// ===================
T.suite('Board Creation');

T.test('FR-01: Board is 10 columns × 22 rows (20 visible + 2 hidden)', function() {
    const board = G.createBoard();
    T.assertEqual(board.length, G.TOTAL_ROWS, 'Board should have TOTAL_ROWS rows');
    T.assertEqual(board[0].length, G.COLUMNS, 'Each row should have COLUMNS cells');
});

T.test('FR-02: All cells start empty (0)', function() {
    const board = G.createBoard();
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
            T.assertEqual(board[r][c], 0, 'Cell [' + r + '][' + c + '] should be 0');
        }
    }
});

// ===================
// Tetromino Definitions
// ===================
T.suite('Tetromino Definitions');

T.test('FR-04: All 7 standard pieces are defined', function() {
    const expectedPieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (const piece of expectedPieces) {
        T.assertTrue(G.TETROMINOES[piece] !== undefined, piece + ' should be defined');
    }
});

T.test('D-06: Each piece has exactly 4 rotation states', function() {
    for (const [name, rotations] of Object.entries(G.TETROMINOES)) {
        T.assertEqual(rotations.length, 4, name + ' should have 4 rotations');
    }
});

T.test('FR-05: Each piece has a distinct color', function() {
    const colors = Object.values(G.PIECE_COLORS);
    const unique = new Set(colors);
    T.assertEqual(unique.size, 7, 'Should have 7 unique colors');
});

// ===================
// Collision Detection
// ===================
T.suite('Collision Detection');

T.test('FR-11: Piece cannot move through left wall', function() {
    const board = G.createBoard();
    const matrix = G.TETROMINOES.O[0]; // 2x2 O-piece
    T.assertFalse(G.isValidPosition(board, matrix, 10, -1), 'Should be invalid at col -1');
});

T.test('FR-11: Piece cannot move through right wall', function() {
    const board = G.createBoard();
    const matrix = G.TETROMINOES.O[0];
    T.assertFalse(G.isValidPosition(board, matrix, 10, G.COLUMNS), 'Should be invalid past right wall');
});

T.test('FR-11: Piece cannot move through floor', function() {
    const board = G.createBoard();
    const matrix = G.TETROMINOES.O[0];
    T.assertFalse(G.isValidPosition(board, matrix, G.TOTAL_ROWS, 4), 'Should be invalid below floor');
});

T.test('FR-12: Piece cannot overlap locked blocks', function() {
    const board = G.createBoard();
    board[20][4] = '#ff0000'; // Lock a block
    const matrix = G.TETROMINOES.O[0];
    T.assertFalse(G.isValidPosition(board, matrix, 19, 4), 'Should be invalid overlapping locked block');
});

T.test('Valid position on empty board returns true', function() {
    const board = G.createBoard();
    const matrix = G.TETROMINOES.T[0];
    T.assertTrue(G.isValidPosition(board, matrix, 5, 4), 'Should be valid in middle of empty board');
});

T.test('FR-13: Rotation blocked if result overlaps wall', function() {
    const board = G.createBoard();
    // I-piece vertical at col 0 — rotating to horizontal would go past left wall
    const horizontalI = G.TETROMINOES.I[0]; // horizontal: 4 wide
    T.assertFalse(G.isValidPosition(board, horizontalI, 10, -1), 'Rotated I should be invalid at col -1');
});

// ===================
// Piece Locking
// ===================
T.suite('Piece Locking');

T.test('FR-10: Locking writes piece color to board', function() {
    const board = G.createBoard();
    const piece = {
        type: 'O', rotation: 0,
        matrix: G.TETROMINOES.O[0],
        row: 20, col: 4, color: '#f0f000'
    };
    G.lockPiece(board, piece);
    T.assertEqual(board[20][4], '#f0f000', 'Cell should have piece color');
    T.assertEqual(board[20][5], '#f0f000', 'Adjacent cell should have piece color');
    T.assertEqual(board[21][4], '#f0f000', 'Cell below should have piece color');
    T.assertEqual(board[21][5], '#f0f000', 'Adjacent cell below should have piece color');
});

T.test('FR-03: Board updates after piece lock', function() {
    const board = G.createBoard();
    const piece = {
        type: 'T', rotation: 0,
        matrix: G.TETROMINOES.T[0],
        row: 19, col: 4, color: '#a000f0'
    };
    G.lockPiece(board, piece);
    // T-piece rotation 0: top-center and middle-3 cells
    T.assertEqual(board[19][5], '#a000f0', 'Top center of T should be locked');
    T.assertEqual(board[20][4], '#a000f0', 'Left of T bottom should be locked');
    T.assertEqual(board[20][5], '#a000f0', 'Center of T bottom should be locked');
    T.assertEqual(board[20][6], '#a000f0', 'Right of T bottom should be locked');
});

// ===================
// Line Clearing
// ===================
T.suite('Line Clearing');

T.test('FR-14: Full row is cleared', function() {
    const board = G.createBoard();
    // Fill bottom row completely
    for (let c = 0; c < G.COLUMNS; c++) {
        board[G.TOTAL_ROWS - 1][c] = '#ff0000';
    }
    const cleared = G.clearLines(board);
    T.assertEqual(cleared, 1, 'Should clear 1 line');
    // Bottom row should now be empty (shifted down from above)
    T.assertEqual(board[G.TOTAL_ROWS - 1][0], 0, 'Bottom row should be empty after clear');
});

T.test('FR-15: Multiple rows cleared simultaneously', function() {
    const board = G.createBoard();
    // Fill bottom 2 rows
    for (let c = 0; c < G.COLUMNS; c++) {
        board[G.TOTAL_ROWS - 1][c] = '#ff0000';
        board[G.TOTAL_ROWS - 2][c] = '#00ff00';
    }
    const cleared = G.clearLines(board);
    T.assertEqual(cleared, 2, 'Should clear 2 lines');
});

T.test('FR-15: Can clear 4 lines at once (Tetris)', function() {
    const board = G.createBoard();
    for (let r = G.TOTAL_ROWS - 4; r < G.TOTAL_ROWS; r++) {
        for (let c = 0; c < G.COLUMNS; c++) {
            board[r][c] = '#ff0000';
        }
    }
    const cleared = G.clearLines(board);
    T.assertEqual(cleared, 4, 'Should clear 4 lines');
});

T.test('FR-16: Rows above cleared row shift down', function() {
    const board = G.createBoard();
    // Put a block in row 19, fill row 20 and 21
    board[19][3] = '#0000ff';
    for (let c = 0; c < G.COLUMNS; c++) {
        board[20][c] = '#ff0000';
        board[21][c] = '#ff0000';
    }
    G.clearLines(board);
    // The blue block should have shifted down 2 rows to row 21
    T.assertEqual(board[21][3], '#0000ff', 'Block above should shift down to fill gap');
});

T.test('Incomplete row is NOT cleared', function() {
    const board = G.createBoard();
    // Fill all but one cell in bottom row
    for (let c = 0; c < G.COLUMNS - 1; c++) {
        board[G.TOTAL_ROWS - 1][c] = '#ff0000';
    }
    const cleared = G.clearLines(board);
    T.assertEqual(cleared, 0, 'Should not clear incomplete row');
});

// ===================
// Scoring
// ===================
T.suite('Scoring');

T.test('FR-17: 1 line = 100 × level', function() {
    T.assertEqual(G.calculateScore(1, 1), 100, 'Level 1, 1 line');
    T.assertEqual(G.calculateScore(1, 5), 500, 'Level 5, 1 line');
});

T.test('FR-17: 2 lines = 300 × level', function() {
    T.assertEqual(G.calculateScore(2, 1), 300, 'Level 1, 2 lines');
    T.assertEqual(G.calculateScore(2, 3), 900, 'Level 3, 2 lines');
});

T.test('FR-17: 3 lines = 500 × level', function() {
    T.assertEqual(G.calculateScore(3, 1), 500, 'Level 1, 3 lines');
});

T.test('FR-17: 4 lines (Tetris) = 800 × level', function() {
    T.assertEqual(G.calculateScore(4, 1), 800, 'Level 1, 4 lines');
    T.assertEqual(G.calculateScore(4, 10), 8000, 'Level 10, 4 lines');
});

// ===================
// Level Calculation
// ===================
T.suite('Level Calculation');

T.test('FR-19: Game starts at level 1 (0 lines)', function() {
    T.assertEqual(G.calculateLevel(0), 1, '0 lines = level 1');
});

T.test('FR-20: Level increases every 10 lines', function() {
    T.assertEqual(G.calculateLevel(9), 1, '9 lines = level 1');
    T.assertEqual(G.calculateLevel(10), 2, '10 lines = level 2');
    T.assertEqual(G.calculateLevel(25), 3, '25 lines = level 3');
    T.assertEqual(G.calculateLevel(100), 11, '100 lines = level 11');
});

// ===================
// Drop Speed
// ===================
T.suite('Drop Speed');

T.test('FR-21: Speed increases with level', function() {
    const speed1 = G.getDropInterval(1);
    const speed5 = G.getDropInterval(5);
    const speed10 = G.getDropInterval(10);
    T.assertTrue(speed1 > speed5, 'Level 5 should be faster than level 1');
    T.assertTrue(speed5 > speed10, 'Level 10 should be faster than level 5');
});

T.test('Level 1 drop interval is 48 frames', function() {
    T.assertEqual(G.getDropInterval(1), 48, 'Level 1 = 48 frames');
});

// ===================
// Bag System
// ===================
T.suite('Bag System');

T.test('D-04: Bag contains all 7 pieces', function() {
    const bag = G.generateBag();
    T.assertEqual(bag.length, 7, 'Bag should have 7 pieces');
    const unique = new Set(bag);
    T.assertEqual(unique.size, 7, 'All 7 pieces should be unique');
});

T.test('D-04: Bag contains exactly I, O, T, S, Z, J, L', function() {
    const bag = G.generateBag();
    const sorted = [...bag].sort().join(',');
    T.assertEqual(sorted, 'I,J,L,O,S,T,Z', 'Should contain exactly the 7 standard pieces');
});

// ===================
// Spawn Centering
// ===================
T.suite('Spawn Centering');

T.test('FR-06: 3-wide pieces (T,S,Z,J,L) spawn centered', function() {
    const threeWidePieces = ['T', 'S', 'Z', 'J', 'L'];
    for (const type of threeWidePieces) {
        const matrix = G.TETROMINOES[type][0];
        const col = Math.floor(G.COLUMNS / 2) - Math.ceil(matrix[0].length / 2);
        // 3-wide piece on 10-col grid: col should be 3 (cells 3,4,5 = centered)
        T.assertEqual(col, 3, type + '-piece should spawn at col 3');
    }
});

T.test('FR-06: I-piece (4-wide) spawns near center', function() {
    const matrix = G.TETROMINOES.I[0];
    const col = Math.floor(G.COLUMNS / 2) - Math.ceil(matrix[0].length / 2);
    // 4-wide on 10-col grid: col 3 (cells 3,4,5,6) — as centered as possible
    T.assertEqual(col, 3, 'I-piece should spawn at col 3');
});

T.test('FR-06: O-piece (2-wide) spawns centered', function() {
    const matrix = G.TETROMINOES.O[0];
    const col = Math.floor(G.COLUMNS / 2) - Math.ceil(matrix[0].length / 2);
    // 2-wide on 10-col grid: col 4 (cells 4,5)
    T.assertEqual(col, 4, 'O-piece should spawn at col 4');
});

// ===================
// Game Over Edge Case
// ===================
T.suite('Game Over');

T.test('FR-25: Spawn overlap detected on full board', function() {
    const board = G.createBoard();
    // Fill the top rows (including hidden) so no piece can spawn
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < G.COLUMNS; c++) {
            board[r][c] = '#ff0000';
        }
    }
    const matrix = G.TETROMINOES.T[0];
    const col = Math.floor(G.COLUMNS / 2) - Math.ceil(matrix[0].length / 2);
    T.assertFalse(G.isValidPosition(board, matrix, 0, col), 'Piece should not fit on full board');
});

// ===================
// Render Results
// ===================
T.render();
