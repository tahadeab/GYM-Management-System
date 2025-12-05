const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Login Flow', () => {
    let electronApp;
    let window;

    test.beforeEach(async () => {
        // Launch Electron app
        electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js')]
        });

        // Wait for the first window
        window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');
    });

    test.afterEach(async () => {
        await electronApp.close();
    });

    test('should display login page on startup', async () => {
        // Check if login page is visible
        const loginTitle = await window.locator('h1, h2, .login-title').first();
        await expect(loginTitle).toBeVisible();
    });

    test('should login with valid credentials', async () => {
        // Fill login form
        await window.fill('input[name="username"], input[type="text"]', 'admin');
        await window.fill('input[name="password"], input[type="password"]', process.env.ADMIN_PASSWORD || 'admin');

        // Click login button
        await window.click('button[type="submit"], .login-btn, .btn-login');

        // Wait for navigation to dashboard
        await window.waitForTimeout(2000);

        // Verify dashboard is loaded (check for common dashboard elements)
        const isDashboardVisible = await window.locator('.dashboard, #dashboard, [data-page="dashboard"]').isVisible();
        expect(isDashboardVisible).toBeTruthy();
    });

    test('should show error message with invalid credentials', async () => {
        // Fill login form with invalid credentials
        await window.fill('input[name="username"], input[type="text"]', 'invaliduser');
        await window.fill('input[name="password"], input[type="password"]', 'wrongpassword');

        // Click login button
        await window.click('button[type="submit"], .login-btn, .btn-login');

        // Wait for error message
        await window.waitForTimeout(1000);

        // Check for error message (could be alert, toast, or error div)
        const hasError = await window.evaluate(() => {
            return document.body.innerText.includes('خطأ') ||
                document.body.innerText.includes('error') ||
                document.body.innerText.includes('invalid');
        });

        expect(hasError).toBeTruthy();
    });

    test('should prevent login with empty credentials', async () => {
        // Try to submit empty form
        await window.click('button[type="submit"], .login-btn, .btn-login');

        // Wait a moment
        await window.waitForTimeout(500);

        // Should still be on login page
        const loginTitle = await window.locator('h1, h2, .login-title').first();
        await expect(loginTitle).toBeVisible();
    });
});
