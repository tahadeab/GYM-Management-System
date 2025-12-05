const { _electron: electron } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Member Management E2E', () => {
    let electronApp;
    let window;

    test.beforeEach(async () => {
        electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js')]
        });

        window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Login first
        await window.fill('input[name="username"], input[type="text"]', 'admin');
        await window.fill('input[name="password"], input[type="password"]', process.env.ADMIN_PASSWORD || 'admin');
        await window.click('button[type="submit"], .login-btn, .btn-login');
        await window.waitForTimeout(2000);
    });

    test.afterEach(async () => {
        await electronApp.close();
    });

    test('should add a new member', async () => {
        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"], #members-link').catch(() => { });
        await window.waitForTimeout(1000);

        // Click add member button
        await window.click('button:has-text("إضافة"), button:has-text("Add"), .add-member-btn').catch(() => { });
        await window.waitForTimeout(500);

        // Fill member form
        const testMemberName = `Test Member ${Date.now()}`;
        await window.fill('input[name="name"], #member-name', testMemberName);
        await window.fill('input[name="email"], #member-email', `test${Date.now()}@example.com`);
        await window.fill('input[name="phone"], #member-phone', `555${Math.floor(Math.random() * 10000000)}`);

        // Submit form
        await window.click('button[type="submit"], .save-btn, .submit-btn');
        await window.waitForTimeout(2000);

        // Verify member appears in list
        const memberExists = await window.locator(`text=${testMemberName}`).isVisible();
        expect(memberExists).toBeTruthy();
    });

    test('should edit an existing member', async () => {
        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Click first edit button
        await window.click('.edit-btn, button:has-text("تعديل"), button:has-text("Edit")').first().catch(() => { });
        await window.waitForTimeout(500);

        // Update member name
        const updatedName = `Updated Member ${Date.now()}`;
        await window.fill('input[name="name"], #member-name', updatedName);

        // Save changes
        await window.click('button[type="submit"], .save-btn, .update-btn');
        await window.waitForTimeout(2000);

        // Verify updated name appears
        const memberExists = await window.locator(`text=${updatedName}`).isVisible().catch(() => false);
        expect(memberExists).toBeTruthy();
    });

    test('should delete a member', async () => {
        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Get initial member count
        const initialCount = await window.locator('.member-row, tr.member, .member-item').count();

        if (initialCount > 0) {
            // Click first delete button
            await window.click('.delete-btn, button:has-text("حذف"), button:has-text("Delete")').first();
            await window.waitForTimeout(500);

            // Confirm deletion (if confirmation dialog appears)
            await window.click('button:has-text("تأكيد"), button:has-text("Confirm"), .confirm-btn').catch(() => { });
            await window.waitForTimeout(2000);

            // Verify member count decreased
            const finalCount = await window.locator('.member-row, tr.member, .member-item').count();
            expect(finalCount).toBeLessThan(initialCount);
        }
    });

    test('should validate required fields when adding member', async () => {
        // Navigate to members page
        await window.click('text=الأعضاء, text=Members, [href*="members"]').catch(() => { });
        await window.waitForTimeout(1000);

        // Click add member button
        await window.click('button:has-text("إضافة"), button:has-text("Add"), .add-member-btn').catch(() => { });
        await window.waitForTimeout(500);

        // Try to submit empty form
        await window.click('button[type="submit"], .save-btn, .submit-btn');
        await window.waitForTimeout(500);

        // Check for validation error
        const hasValidationError = await window.evaluate(() => {
            return document.body.innerText.includes('مطلوب') ||
                document.body.innerText.includes('required') ||
                document.querySelector('input:invalid') !== null;
        });

        expect(hasValidationError).toBeTruthy();
    });
});
