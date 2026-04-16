// ============================================================
// Minimal Test Runner — No dependencies
// ============================================================
// Open tests.html in browser to run. Results shown on page.
// ============================================================

const TestRunner = {
    results: [],
    currentSuite: '',

    suite(name) {
        this.currentSuite = name;
    },

    test(name, fn) {
        try {
            fn();
            this.results.push({ suite: this.currentSuite, name, passed: true });
        } catch (error) {
            this.results.push({ suite: this.currentSuite, name, passed: false, error: error.message });
        }
    },

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(
                (message || 'Assertion failed') +
                ': expected ' + JSON.stringify(expected) +
                ', got ' + JSON.stringify(actual)
            );
        }
    },

    assertTrue(value, message) {
        if (!value) {
            throw new Error((message || 'Expected true') + ', got ' + JSON.stringify(value));
        }
    },

    assertFalse(value, message) {
        if (value) {
            throw new Error((message || 'Expected false') + ', got ' + JSON.stringify(value));
        }
    },

    render() {
        const container = document.getElementById('test-results');
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;

        let html = '<h2>Results: ' + passed + '/' + total + ' passed';
        if (failed > 0) html += ' — <span style="color:#f00">' + failed + ' FAILED</span>';
        html += '</h2>';

        let currentSuite = '';
        for (const result of this.results) {
            if (result.suite !== currentSuite) {
                currentSuite = result.suite;
                html += '<h3>' + currentSuite + '</h3>';
            }

            if (result.passed) {
                html += '<div class="pass">✓ ' + result.name + '</div>';
            } else {
                html += '<div class="fail">✗ ' + result.name + '<br><small>' + result.error + '</small></div>';
            }
        }

        container.innerHTML = html;
    }
};
