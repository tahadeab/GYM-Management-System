const TestHelper = require('../helpers/testHelper');

describe('Trainer Management', () => {
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

    describe('Add Trainer', () => {
        test('should add valid trainer successfully', async () => {
            const trainerData = {
                name: 'Coach Mike',
                specialty: 'Strength Training',
                email: 'mike@gym.com',
                phone: '1234567890'
            };

            const trainerId = await db.addTrainer(trainerData, adminUser);

            expect(trainerId).toBeDefined();
            expect(trainerId).toBeGreaterThan(0);
        });

        test('should reject trainer with empty name', async () => {
            const trainerData = {
                name: '',
                email: 'test@gym.com'
            };

            await expect(db.addTrainer(trainerData, adminUser)).rejects.toThrow('اسم المدرب مطلوب');
        });

        test('should track created_by user', async () => {
            const trainerId = await testHelper.createTestTrainer({}, staffUser);

            const trainer = await new Promise((resolve, reject) => {
                db.db.get('SELECT * FROM trainers WHERE id = ?', [trainerId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            expect(trainer.created_by).toBe(staffUser.id);
        });
    });

    describe('Update Trainer', () => {
        test('should update trainer successfully as admin', async () => {
            const trainerId = await testHelper.createTestTrainer({}, staffUser);

            const updatedData = {
                name: 'Updated Coach',
                specialty: 'Cardio',
                email: 'updated@gym.com',
                phone: '9999999999',
                status: 'active'
            };

            const result = await db.updateTrainer(trainerId, updatedData, adminUser);

            expect(result).toBeGreaterThan(0);
        });

        test('should allow staff to update their own trainer', async () => {
            const trainerId = await testHelper.createTestTrainer({}, staffUser);

            const updatedData = {
                name: 'Staff Updated Coach',
                specialty: 'Yoga',
                status: 'active'
            };

            const result = await db.updateTrainer(trainerId, updatedData, staffUser);

            expect(result).toBeGreaterThan(0);
        });

        test('should prevent staff from updating other staff trainer', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');
            const trainerId = await testHelper.createTestTrainer({}, staff2);

            const updatedData = {
                name: 'Unauthorized Update',
                status: 'active'
            };

            await expect(db.updateTrainer(trainerId, updatedData, staffUser))
                .rejects.toThrow('غير مصرح لك بتحديث هذا المدرب');
        });

        test('should reject invalid email', async () => {
            const trainerId = await testHelper.createTestTrainer({}, adminUser);

            const updatedData = {
                name: 'Test Trainer',
                email: 'invalid-email',
                status: 'active'
            };

            await expect(db.updateTrainer(trainerId, updatedData, adminUser))
                .rejects.toThrow('البريد الإلكتروني غير صالح');
        });

        test('should reject duplicate email/phone', async () => {
            const trainer1 = await testHelper.createTestTrainer({
                email: 'trainer1@gym.com',
                phone: '1111111111'
            }, adminUser);

            const trainer2 = await testHelper.createTestTrainer({
                email: 'trainer2@gym.com',
                phone: '2222222222'
            }, adminUser);

            const updatedData = {
                name: 'Test',
                email: 'trainer1@gym.com', // Duplicate
                phone: '3333333333',
                status: 'active'
            };

            await expect(db.updateTrainer(trainer2, updatedData, adminUser))
                .rejects.toThrow('المدرب موجود بالفعل');
        });
    });

    describe('List Trainers', () => {
        test('should return all trainers for admin', async () => {
            await testHelper.createTestTrainer({}, staffUser);
            await testHelper.createTestTrainer({}, adminUser);

            const trainers = await db.getAllTrainers(adminUser);

            expect(trainers.length).toBeGreaterThanOrEqual(2);
        });

        test('should return only own trainers for staff', async () => {
            const staff2 = await testHelper.createTestUser('staff2', 'password', 'staff');

            await testHelper.createTestTrainer({}, staffUser);
            await testHelper.createTestTrainer({}, staff2);

            const trainers = await db.getAllTrainers(staffUser);

            expect(trainers.length).toBe(1);
            expect(trainers[0].created_by).toBe(staffUser.id);
        });
    });
});
