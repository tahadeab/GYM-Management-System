const TestHelper = require('../helpers/testHelper');

describe('Integration Tests - User Flows', () => {
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

    describe('Complete Member Registration Flow', () => {
        test('should handle full member registration with subscription', async () => {
            // Step 1: Create member
            const memberData = {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '5551234567',
                membership_type: 'monthly',
                status: 'active',
                join_date: new Date().toISOString(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            const memberId = await db.addMember(memberData, staffUser);
            expect(memberId).toBeGreaterThan(0);

            // Step 2: Verify member exists
            const member = await testHelper.getMemberById(memberId);
            expect(member).toBeDefined();
            expect(member.name).toBe('Jane Smith');

            // Step 3: Verify subscription created
            const subscription = await new Promise((resolve, reject) => {
                db.db.get(
                    'SELECT * FROM subscriptions WHERE member_id = ? AND status = "active"',
                    [memberId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            expect(subscription).toBeDefined();
            expect(subscription.status).toBe('active');
        });
    });

    describe('Subscription Renewal Flow', () => {
        test('should handle complete subscription renewal with payment', async () => {
            // Step 1: Create member
            const memberId = await testHelper.createTestMember({}, staffUser);

            // Step 2: Renew subscription
            const renewalResult = await db.renewSubscription(
                memberId,
                1,
                150,
                'cash',
                staffUser.id
            );

            expect(renewalResult.success).toBe(true);

            // Step 3: Verify payment created
            const payments = await db.getPayments(staffUser);
            const memberPayment = payments.find(p => p.member_id === memberId);
            expect(memberPayment).toBeDefined();
            expect(memberPayment.amount).toBe(150);

            // Step 4: Verify subscription updated
            const subscription = await new Promise((resolve, reject) => {
                db.db.get(
                    'SELECT * FROM subscriptions WHERE member_id = ?',
                    [memberId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            expect(subscription).toBeDefined();
            expect(new Date(subscription.end_date).getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Multi-User Concurrent Operations', () => {
        test('should handle concurrent member creation by different users', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');

            // Create members concurrently
            const [member1Id, member2Id] = await Promise.all([
                testHelper.createTestMember({ name: 'Member 1' }, staffUser),
                testHelper.createTestMember({ name: 'Member 2' }, staff2)
            ]);

            expect(member1Id).toBeGreaterThan(0);
            expect(member2Id).toBeGreaterThan(0);

            // Verify isolation
            const staff1Members = await db.getAllMembers(staffUser);
            const staff2Members = await db.getAllMembers(staff2);

            const staff1MemberIds = staff1Members.map(m => m.id);
            const staff2MemberIds = staff2Members.map(m => m.id);

            expect(staff1MemberIds).toContain(member1Id);
            expect(staff1MemberIds).not.toContain(member2Id);
            expect(staff2MemberIds).toContain(member2Id);
            expect(staff2MemberIds).not.toContain(member1Id);
        });

        test('should prevent duplicate member creation in concurrent operations', async () => {
            const email = 'duplicate@example.com';
            const phone = '5555555555';

            const memberData1 = {
                name: 'Member 1',
                email,
                phone
            };

            const memberData2 = {
                name: 'Member 2',
                email,
                phone
            };

            // Attempt concurrent creation with same email/phone
            const results = await Promise.allSettled([
                db.addMember(memberData1, staffUser),
                db.addMember(memberData2, staffUser)
            ]);

            // One should succeed, one should fail
            const fulfilled = results.filter(r => r.status === 'fulfilled');
            const rejected = results.filter(r => r.status === 'rejected');

            expect(fulfilled.length).toBe(1);
            expect(rejected.length).toBe(1);
        });
    });

    describe('Database Transaction Integrity', () => {
        test('should rollback member creation on subscription failure', async () => {
            // This test verifies transaction atomicity
            const initialMemberCount = await testHelper.countRecords('members');

            // Create member with invalid subscription data that will cause failure
            const memberData = {
                name: 'Test Member',
                email: 'test@example.com',
                phone: '5551111111',
                expiryDate: 'invalid-date' // This will cause an error
            };

            try {
                await db.addMember(memberData, staffUser);
            } catch (error) {
                // Expected to fail
            }

            // Verify no member was added (transaction rolled back)
            const finalMemberCount = await testHelper.countRecords('members');
            expect(finalMemberCount).toBe(initialMemberCount);
        });

        test('should maintain referential integrity on member operations', async () => {
            // Create member with subscription
            const memberId = await testHelper.createTestMember({
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }, staffUser);

            // Add payment for member
            await db.addPayment({
                member_id: memberId,
                amount: 100,
                method: 'cash',
                description: 'Test payment',
                processed_by: staffUser.id
            });

            // Verify foreign key relationships
            const memberPayments = await new Promise((resolve, reject) => {
                db.db.all(
                    'SELECT p.*, m.name FROM payments p JOIN members m ON p.member_id = m.id WHERE p.member_id = ?',
                    [memberId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            expect(memberPayments.length).toBeGreaterThan(0);
            expect(memberPayments[0].name).toBeDefined();
        });
    });

    describe('Admin vs Staff Isolation', () => {
        test('should enforce complete data isolation for staff users', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');

            // Staff 1 creates members, trainers, and payments
            const staff1Member = await testHelper.createTestMember({ name: 'Staff 1 Member' }, staffUser);
            const staff1Trainer = await testHelper.createTestTrainer({ name: 'Staff 1 Trainer' }, staffUser);
            await db.addPayment({
                member_id: staff1Member,
                amount: 100,
                method: 'cash',
                description: 'Staff 1 payment',
                processed_by: staffUser.id
            });

            // Staff 2 creates their own data
            const staff2Member = await testHelper.createTestMember({ name: 'Staff 2 Member' }, staff2);
            const staff2Trainer = await testHelper.createTestTrainer({ name: 'Staff 2 Trainer' }, staff2);

            // Verify Staff 1 can only see their data
            const staff1Members = await db.getAllMembers(staffUser);
            const staff1Trainers = await db.getAllTrainers(staffUser);
            const staff1Payments = await db.getPayments(staffUser);

            expect(staff1Members.every(m => m.created_by === staffUser.id)).toBe(true);
            expect(staff1Trainers.every(t => t.created_by === staffUser.id)).toBe(true);
            expect(staff1Payments.every(p => p.processed_by === staffUser.id || p.created_by === staffUser.id)).toBe(true);

            // Verify Staff 2 can only see their data
            const staff2Members = await db.getAllMembers(staff2);
            const staff2Trainers = await db.getAllTrainers(staff2);

            expect(staff2Members.every(m => m.created_by === staff2.id)).toBe(true);
            expect(staff2Trainers.every(t => t.created_by === staff2.id)).toBe(true);

            // Verify Admin can see all data
            const adminMembers = await db.getAllMembers(adminUser);
            const adminTrainers = await db.getAllTrainers(adminUser);

            expect(adminMembers.length).toBeGreaterThanOrEqual(2);
            expect(adminTrainers.length).toBeGreaterThanOrEqual(2);
        });
    });
});
