const { _electron: electron } = require('@playwright/test');

module.exports = {
    testDir: './tests/e2e',
    timeout: 60000,
    expect: {
        timeout: 10000
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Run tests serially for Electron
    reporter: [
        ['html'],
        ['list']
    ],
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'electron',
            use: {},
        },
    ],
};
