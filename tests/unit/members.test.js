const TestHelper = require('../helpers/testHelper');

describe('Member Management', () => {
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

    describe('Add Member', () => {
        test('should add valid member successfully', async () => {
            const memberData = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '1234567890',
                membership_type: 'monthly',
                status: 'active',
                join_date: new Date().toISOString()
            };

            const memberId = await db.addMember(memberData, adminUser);

            expect(memberId).toBeDefined();
            expect(memberId).toBeGreaterThan(0);

            const member = await testHelper.getMemberById(memberId);
            expect(member.name).toBe('John Doe');
            expect(member.email).toBe('john@example.com');
        });

        test('should reject member with empty name', async () => {
            const memberData = {
                name: '',
                email: 'test@example.com'
            };

            await expect(db.addMember(memberData, adminUser)).rejects.toThrow('اسم العضو مطلوب');
        });

        test('should reject member with invalid email', async () => {
            const memberData = {
                name: 'Test Member',
                email: 'invalid-email'
            };

            await expect(db.addMember(memberData, adminUser)).rejects.toThrow('البريد الإلكتروني غير صالح');
        });

        test('should reject member with invalid phone', async () => {
            const memberData = {
                name: 'Test Member',
                phone: '123' // Too short
            };

            await expect(db.addMember(memberData, adminUser)).rejects.toThrow('رقم الهاتف غير صالح');
        });

        test('should reject duplicate email', async () => {
            const memberData1 = {
                name: 'Member 1',
                email: 'duplicate@example.com',
                phone: '1234567890'
            };

            const memberData2 = {
                name: 'Member 2',
                email: 'duplicate@example.com',
                phone: '9876543210'
            };

            await db.addMember(memberData1, adminUser);
            await expect(db.addMember(memberData2, adminUser)).rejects.toThrow('العضو موجود بالفعل');
        });

        test('should reject duplicate phone', async () => {
            const memberData1 = {
                name: 'Member 1',
                email: 'member1@example.com',
                phone: '1234567890'
            };

            const memberData2 = {
                name: 'Member 2',
                email: 'member2@example.com',
                phone: '1234567890'
            };

            await db.addMember(memberData1, adminUser);
            await expect(db.addMember(memberData2, adminUser)).rejects.toThrow('العضو موجود بالفعل');
        });

        test('should track created_by user', async () => {
            const memberId = await testHelper.createTestMember({}, staffUser);

            const member = await testHelper.getMemberById(memberId);
            expect(member.created_by).toBe(staffUser.id);
        });
    });

    describe('Update Member', () => {
        test('should update member successfully as admin', async () => {
            const memberId = await testHelper.createTestMember({}, staffUser);

            const updatedData = {
                name: 'Updated Name',
                email: 'updated@example.com',
                phone: '9999999999',
                status: 'active'
            };

            const result = await db.updateMember(memberId, updatedData, adminUser);

            expect(result).toBeGreaterThan(0);

            const member = await testHelper.getMemberById(memberId);
            expect(member.name).toBe('Updated Name');
            expect(member.email).toBe('updated@example.com');
        });

        test('should allow staff to update their own member', async () => {
            const memberId = await testHelper.createTestMember({}, staffUser);

            const updatedData = {
                name: 'Staff Updated',
                status: 'active'
            };

            const result = await db.updateMember(memberId, updatedData, staffUser);

            expect(result).toBeGreaterThan(0);
        });

        test('should prevent staff from updating other staff member', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');
            const memberId = await testHelper.createTestMember({}, staff2);

            const updatedData = {
                name: 'Unauthorized Update',
                status: 'active'
            };

            await expect(db.updateMember(memberId, updatedData, staffUser))
                .rejects.toThrow('غير مصرح لك بتحديث هذا العضو');
        });
    });

    describe('List Members', () => {
        test('should return all members for admin', async () => {
            await testHelper.createTestMember({}, staffUser);
            await testHelper.createTestMember({}, adminUser);

            const members = await db.getAllMembers(adminUser);

            expect(members.length).toBeGreaterThanOrEqual(2);
        });

        test('should return only own members for staff', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');

            await testHelper.createTestMember({}, staffUser);
            await testHelper.createTestMember({}, staff2);

            const members = await db.getAllMembers(staffUser);

            expect(members.length).toBe(1);
            expect(members[0].created_by).toBe(staffUser.id);
        });
    });
});
