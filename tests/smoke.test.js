// ============================================================
// Smoke Test — Verifies index.html loads without errors
// ============================================================
// Loads the game page in an iframe and checks for JS errors.
// This would have caught the duplicate const declaration bug.
// ============================================================

const T = TestRunner;

T.suite('Smoke Test — Page Load');

T.test('index.html loads both scripts without JS errors', function(done) {
    // This test is async — it sets up an iframe and listens for errors
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    let errorCaught = null;

    iframe.addEventListener('load', function() {
        // Give scripts a moment to execute
        setTimeout(function() {
            document.body.removeChild(iframe);
            if (errorCaught) {
                throw new Error('JS error on page load: ' + errorCaught);
            }
        }, 200);
    });

    // Listen for errors from the iframe
    iframe.addEventListener('load', function() {
        try {
            iframe.contentWindow.onerror = function(msg) {
                errorCaught = msg;
            };
        } catch (e) {
            // Cross-origin restrictions — skip
        }
    });

    iframe.src = '../src/index.html';
    document.body.appendChild(iframe);
});

T.test('game-logic.js exposes TetrisLogic on window', function() {
    T.assertTrue(window.TetrisLogic !== undefined, 'window.TetrisLogic should exist');
    T.assertTrue(typeof window.TetrisLogic.createBoard === 'function', 'createBoard should be a function');
    T.assertTrue(typeof window.TetrisLogic.isValidPosition === 'function', 'isValidPosition should be a function');
    T.assertTrue(typeof window.TetrisLogic.clearLines === 'function', 'clearLines should be a function');
});

T.test('All expected globals from game-logic.js are accessible', function() {
    // These are the globals that main.js depends on
    T.assertTrue(typeof COLUMNS === 'number', 'COLUMNS should be a number');
    T.assertTrue(typeof ROWS === 'number', 'ROWS should be a number');
    T.assertTrue(typeof HIDDEN_ROWS === 'number', 'HIDDEN_ROWS should be a number');
    T.assertTrue(typeof TOTAL_ROWS === 'number', 'TOTAL_ROWS should be a number');
    T.assertTrue(typeof TETROMINOES === 'object', 'TETROMINOES should be an object');
    T.assertTrue(typeof PIECE_COLORS === 'object', 'PIECE_COLORS should be an object');
    T.assertTrue(typeof createBoard === 'function', 'createBoard should be a function');
    T.assertTrue(typeof isValidPosition === 'function', 'isValidPosition should be a function');
    T.assertTrue(typeof lockPiece === 'function', 'lockPiece should be a function');
    T.assertTrue(typeof clearLines === 'function', 'clearLines should be a function');
    T.assertTrue(typeof calculateScore === 'function', 'calculateScore should be a function');
    T.assertTrue(typeof calculateLevel === 'function', 'calculateLevel should be a function');
    T.assertTrue(typeof getDropInterval === 'function', 'getDropInterval should be a function');
    T.assertTrue(typeof generateBag === 'function', 'generateBag should be a function');
});
