const TestHelper = require('../helpers/testHelper');
const bcrypt = require('bcryptjs');

describe('User Authentication', () => {
    let testHelper;
    let db;

    beforeEach(async () => {
        testHelper = new TestHelper();
        db = await testHelper.createTestDatabase();
    });

    afterEach(async () => {
        await testHelper.cleanupTestDatabase();
    });

    test('should authenticate user with valid credentials', async () => {
        const password = 'testpass123';
        const user = await testHelper.createTestUser('testuser', password, 'staff');

        const authenticatedUser = await db.authenticateUser('testuser', password);

        expect(authenticatedUser).toBeDefined();
        expect(authenticatedUser.username).toBe('testuser');
        expect(authenticatedUser.role).toBe('staff');
    });

    test('should reject authentication with invalid password', async () => {
        const password = 'testpass123';
        await testHelper.createTestUser('testuser', password, 'staff');

        const authenticatedUser = await db.authenticateUser('testuser', 'wrongpassword');

        expect(authenticatedUser).toBeNull();
    });

    test('should reject authentication for non-existent user', async () => {
        const authenticatedUser = await db.authenticateUser('nonexistent', 'password');

        expect(authenticatedUser).toBeNull();
    });

    test('should reject authentication for inactive user', async () => {
        const password = 'testpass123';
        const user = await testHelper.createTestUser('testuser', password, 'staff');

        // Deactivate user
        await new Promise((resolve, reject) => {
            db.db.run('UPDATE users SET status = ? WHERE id = ?', ['inactive', user.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const authenticatedUser = await db.authenticateUser('testuser', password);

        expect(authenticatedUser).toBeNull();
    });

    test('should update last login timestamp on successful authentication', async () => {
        const password = 'testpass123';
        await testHelper.createTestUser('testuser', password, 'staff');

        await db.authenticateUser('testuser', password);

        // Wait a bit for the update
        await new Promise(resolve => setTimeout(resolve, 100));

        const user = await testHelper.getUserByUsername('testuser');
        expect(user.last_login).toBeDefined();
    });

    test('should hash passwords securely', async () => {
        const password = 'testpass123';
        const user = await testHelper.createTestUser('testuser', password, 'staff');

        const userFromDb = await testHelper.getUserByUsername('testuser');

        // Password should be hashed, not plain text
        expect(userFromDb.password).not.toBe(password);

        // Hashed password should be verifiable
        const isValid = await bcrypt.compare(password, userFromDb.password);
        expect(isValid).toBe(true);
    });

    test('should prevent deletion of last admin user', async () => {
        const adminUser = await testHelper.getUserByUsername('admin');

        await expect(db.deleteUser(adminUser.id)).rejects.toThrow('لا يمكن حذف آخر مدير في النظام');
    });

    test('should allow deletion of non-admin user', async () => {
        const user = await testHelper.createTestUser('staffuser', 'password', 'staff');

        const result = await db.deleteUser(user.id);

        expect(result).toBeGreaterThan(0);

        const deletedUser = await testHelper.getUserByUsername('staffuser');
        expect(deletedUser.status).toBe('inactive');
    });

    test('should allow deletion of admin when multiple admins exist', async () => {
        const admin2 = await testHelper.createTestUser('admin2', 'password', 'admin', 'Second Admin');

        const result = await db.deleteUser(admin2.id);

        expect(result).toBeGreaterThan(0);
    });
});
