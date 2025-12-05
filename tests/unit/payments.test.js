const TestHelper = require('../helpers/testHelper');

describe('Payment Processing and Subscriptions', () => {
    let testHelper;
    let db;
    let adminUser;
    let staffUser;

    beforeEach(async () => {
        testHelper = new TestHelper();
        db = await testHelper.createTestDatabase();
        adminUser = await testHelper.getUserByUsername('admin');
        staffUser = await testHelper.createTestUser('staffuser', 'password', 'staff');
    });

    afterEach(async () => {
        await testHelper.cleanupTestDatabase();
    });

    describe('Add Payment', () => {
        test('should add payment successfully', async () => {
            const memberId = await testHelper.createTestMember({}, adminUser);

            const payment = {
                member_id: memberId,
                amount: 100,
                method: 'cash',
                description: 'Monthly subscription',
                processed_by: adminUser.id
            };

            const paymentId = await db.addPayment(payment);

            expect(paymentId).toBeDefined();
            expect(paymentId).toBeGreaterThan(0);
        });
    });

    describe('Subscription Renewal', () => {
        test('should renew subscription successfully', async () => {
            const memberId = await testHelper.createTestMember({}, adminUser);

            const result = await db.renewSubscription(memberId, 1, 100, 'cash', adminUser.id);

            expect(result.success).toBe(true);
            expect(result.newEndDate).toBeDefined();
        });

        test('should extend existing active subscription', async () => {
            const memberId = await testHelper.createTestMember({
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }, adminUser);

            const result = await db.renewSubscription(memberId, 1, 100, 'cash', adminUser.id);

            expect(result.success).toBe(true);

            // New end date should be after current expiry
            const newEndDate = new Date(result.newEndDate);
            const expectedMinDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            expect(newEndDate.getTime()).toBeGreaterThan(expectedMinDate.getTime());
        });

        test('should create payment record on renewal', async () => {
            const memberId = await testHelper.createTestMember({}, adminUser);

            await db.renewSubscription(memberId, 1, 100, 'cash', adminUser.id);

            const paymentsCount = await new Promise((resolve, reject) => {
                db.db.get(
                    'SELECT COUNT(*) as count FROM payments WHERE member_id = ?',
                    [memberId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count);
                    }
                );
            });

            expect(paymentsCount).toBeGreaterThan(0);
        });

        test('should reject invalid member ID', async () => {
            await expect(db.renewSubscription(null, 1, 100, 'cash', adminUser.id))
                .rejects.toThrow('رقم العضو مطلوب');
        });

        test('should reject zero or negative duration', async () => {
            const memberId = await testHelper.createTestMember({}, adminUser);

            await expect(db.renewSubscription(memberId, 0, 100, 'cash', adminUser.id))
                .rejects.toThrow('مدة الاشتراك يجب أن تكون أكبر من صفر');

            await expect(db.renewSubscription(memberId, -1, 100, 'cash', adminUser.id))
                .rejects.toThrow('مدة الاشتراك يجب أن تكون أكبر من صفر');
        });

        test('should reject negative amount', async () => {
            const memberId = await testHelper.createTestMember({}, adminUser);

            await expect(db.renewSubscription(memberId, 1, -50, 'cash', adminUser.id))
                .rejects.toThrow('المبلغ لا يمكن أن يكون سالباً');
        });

        test('should handle transaction rollback on error', async () => {
            // This test ensures atomicity
            const memberId = 99999; // Non-existent member

            try {
                await db.renewSubscription(memberId, 1, 100, 'cash', adminUser.id);
            } catch (error) {
                // Expected to fail
            }

            // Verify no orphaned payment was created
            const paymentsCount = await testHelper.countRecords('payments');
            expect(paymentsCount).toBe(0);
        });
    });

    describe('Get Payments', () => {
        test('should return all payments for admin', async () => {
            const member1 = await testHelper.createTestMember({}, staffUser);
            const member2 = await testHelper.createTestMember({}, adminUser);

            await db.addPayment({
                member_id: member1,
                amount: 100,
                method: 'cash',
                description: 'Test 1',
                processed_by: staffUser.id
            });

            await db.addPayment({
                member_id: member2,
                amount: 200,
                method: 'card',
                description: 'Test 2',
                processed_by: adminUser.id
            });

            const payments = await db.getPayments(adminUser);

            expect(payments.length).toBeGreaterThanOrEqual(2);
        });

        test('should return only own payments for staff', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');
            const member1 = await testHelper.createTestMember({}, staffUser);
            const member2 = await testHelper.createTestMember({}, staff2);

            await db.addPayment({
                member_id: member1,
                amount: 100,
                method: 'cash',
                description: 'Staff 1 payment',
                processed_by: staffUser.id
            });

            await db.addPayment({
                member_id: member2,
                amount: 200,
                method: 'cash',
                description: 'Staff 2 payment',
                processed_by: staff2.id
            });

            const payments = await db.getPayments(staffUser);

            expect(payments.length).toBe(1);
            expect(payments[0].processed_by).toBe(staffUser.id);
        });
    });
});
