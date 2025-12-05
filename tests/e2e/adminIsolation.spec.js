const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');
const TestHelper = require('../helpers/testHelper');

test.describe('Admin Isolation E2E', () => {
    let electronApp;
    let window;
    let testHelper;

    test.beforeAll(async () => {
        // Create test database with multiple users
        testHelper = new TestHelper();
        const db = await testHelper.createTestDatabase();

        // Create staff users with test data
        const staff1 = await testHelper.createTestUser('staff1', 'password1', 'staff');
        const staff2 = await testHelper.createTestUser('staff2', 'password2', 'staff');

        // Create members for each staff
        await testHelper.createTestMember({ name: 'Staff 1 Member' }, staff1);
        await testHelper.createTestMember({ name: 'Staff 2 Member' }, staff2);

        // Close the test database
        await testHelper.cleanupTestDatabase();
    });

    test.beforeEach(async () => {
        electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js')]
        });

        window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');
    });

    test.afterEach(async () => {
        await electronApp.close();
    });

    test('should show only own data for staff user', async () => {
        // Login as staff1
        await window.fill('input[name="username"], input[type="text"]', 'staff1');
        await window.fill('input[name="password"], input[type="password"]', 'password1');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);

        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Check that only Staff 1 Member is visible
        const staff1MemberVisible = await window.locator('text=Staff 1 Member').isVisible().catch(() => false);
        const staff2MemberVisible = await window.locator('text=Staff 2 Member').isVisible().catch(() => false);

        expect(staff1MemberVisible).toBeTruthy();
        expect(staff2MemberVisible).toBeFalsy();
    });

    test('should show all data for admin user', async () => {
        // Login as admin
        await window.fill('input[name="username"], input[type="text"]', 'admin');
        await window.fill('input[name="password"], input[type="password"]', process.env.ADMIN_PASSWORD || 'admin');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);

        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Admin should see members from all staff
        const memberCount = await window.locator('.member-row, tr.member, .member-item').count();

        // Should see at least 2 members (one from each staff)
        expect(memberCount).toBeGreaterThanOrEqual(2);
    });

    test('should prevent staff from editing other staff data', async () => {
        // Login as staff1
        await window.fill('input[name="username"], input[type="text"]', 'staff1');
        await window.fill('input[name="password"], input[type="password"]', 'password1');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);

        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Staff 2 Member should not be visible/editable
        const staff2MemberVisible = await window.locator('text=Staff 2 Member').isVisible().catch(() => false);
        expect(staff2MemberVisible).toBeFalsy();
    });

    test('should show user management only to admin', async () => {
        // Login as staff
        await window.fill('input[name="username"], input[type="text"]', 'staff1');
        await window.fill('input[name="password"], input[type="password"]', 'password1');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);

        // Check if users/settings menu is hidden for staff
        const usersMenuVisible = await window.locator('text=المستخدمين, text=Users, [href*="users"]').isVisible().catch(() => false);

        // Staff should not see user management
        expect(usersMenuVisible).toBeFalsy();

        // Logout
        await window.click('text=تسجيل خروج, text=Logout, .logout-btn').catch(() => { });
        await window.waitForTimeout(1000);

        // Login as admin
        await window.fill('input[name="username"], input[type="text"]', 'admin');
        await window.fill('input[name="password"], input[type="password"]', process.env.ADMIN_PASSWORD || 'admin');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);

        // Admin should see user management
        const adminUsersMenuVisible = await window.locator('text=المستخدمين, text=Users, [href*="users"]').isVisible().catch(() => false);
        expect(adminUsersMenuVisible).toBeTruthy();
    });
});
