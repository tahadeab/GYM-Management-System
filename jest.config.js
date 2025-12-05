module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'database/**/*.js',
        'scripts/**/*.js',
        'main.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**'
    ],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    coverageReporters: ['text', 'lcov', 'html'],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],

    // Test timeout
    testTimeout: 30000,

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/dist/'
    ],

    // Verbose output
    verbose: true,

    // Run tests serially to avoid database conflicts
    maxWorkers: 1
};
