const TestHelper = require('../helpers/testHelper');

describe('Database Initialization and Connection', () => {
    let testHelper;

    beforeEach(async () => {
        testHelper = new TestHelper();
    });

    afterEach(async () => {
        await testHelper.cleanupTestDatabase();
    });

    test('should create database instance successfully', async () => {
        const db = await testHelper.createTestDatabase();
        expect(db).toBeDefined();
        expect(db.db).toBeDefined();
    });

    test('should initialize all required tables', async () => {
        const db = await testHelper.createTestDatabase();

        const tables = [
            'users', 'members', 'trainers', 'subscriptions',
            'attendance', 'payments', 'equipment', 'classes',
            'class_bookings', 'notifications', 'discounts',
            'activity_log', 'settings', 'workout_plans',
            'exercises', 'body_measurements'
        ];

        for (const table of tables) {
            const count = await testHelper.countRecords(table);
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should create default admin user', async () => {
        const db = await testHelper.createTestDatabase();

        const adminUser = await testHelper.getUserByUsername('admin');
        expect(adminUser).toBeDefined();
        expect(adminUser.username).toBe('admin');
        expect(adminUser.role).toBe('admin');
        expect(adminUser.status).toBe('active');
    });

    test('should insert default settings', async () => {
        const db = await testHelper.createTestDatabase();

        const settingsCount = await testHelper.countRecords('settings');
        expect(settingsCount).toBeGreaterThan(0);
    });

    test('should handle database close gracefully', async () => {
        const db = await testHelper.createTestDatabase();

        expect(() => {
            db.close();
        }).not.toThrow();
    });
});
