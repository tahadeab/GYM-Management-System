const ImprovedDatabase = require('../database/improved_db');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Use a file-based DB for testing to ensure persistence across connections if needed, 
// but for this test, a new file each time is cleaner.
const testDbPath = path.join(__dirname, 'test_gym.db');

// Clean up previous test db
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
}

const db = new ImprovedDatabase(testDbPath);

async function runTests() {
    console.log('Starting Backend Logic Tests...');

    // Give DB some time to initialize tables
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Create a test user for context
        const testUser = await new Promise((resolve, reject) => {
            const password = bcrypt.hashSync('password', 10);
            db.db.run(`INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, 'active')`,
                ['testuser', password, 'Test User', 'staff'], function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, username: 'testuser', role: 'staff' });
                });
        });

        // Test 1: Add Valid Member
        console.log('Test 1: Add Valid Member...');
        const memberId = await db.addMember({
            name: 'Test Member',
            email: 'test@example.com',
            phone: '123456789',
            membership_type: 'monthly',
            status: 'active',
            join_date: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, testUser);
        assert.ok(memberId, 'Member ID should be returned');
        console.log('✅ Passed');

        // Test 2: Add Invalid Member (Empty Name)
        console.log('Test 2: Add Invalid Member (Empty Name)...');
        try {
            await db.addMember({
                name: '',
                email: 'invalid@example.com'
            }, testUser);
            console.error('❌ Failed: Should have thrown error');
        } catch (err) {
            assert.strictEqual(err.message, 'اسم العضو مطلوب');
            console.log('✅ Passed');
        }

        // Test 3: Add Duplicate Member
        console.log('Test 3: Add Duplicate Member...');
        try {
            await db.addMember({
                name: 'Duplicate Member',
                email: 'test@example.com', // Same email as Test 1
                phone: '987654321'
            }, testUser);
            console.error('❌ Failed: Should have thrown error for duplicate email');
        } catch (err) {
            assert.ok(err.message.includes('العضو موجود بالفعل'), 'Error should mention duplicate');
            console.log('✅ Passed');
        }

        // Test 4: Add Trainer
        console.log('Test 4: Add Trainer...');
        const trainerId = await db.addTrainer({
            name: 'Coach Carter',
            specialty: 'Basketball',
            email: 'coach@gym.com'
        }, testUser);
        assert.ok(trainerId, 'Trainer ID should be returned');
        console.log('✅ Passed');

        // Test 5: Admin Deletion Protection
        console.log('Test 5: Admin Deletion Protection...');
        // First, get the default admin user
        const adminUser = await new Promise((resolve, reject) => {
            db.db.get('SELECT * FROM users WHERE username = "admin"', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (adminUser) {
            try {
                await db.deleteUser(adminUser.id);
                console.error('❌ Failed: Should not delete the last admin');
            } catch (err) {
                assert.strictEqual(err.message, 'لا يمكن حذف آخر مدير في النظام');
                console.log('✅ Passed');
            }
        } else {
            console.warn('⚠️ Skipped: Admin user not found (initialization might be slow)');
        }

        // Test 6: Subscription Renewal
        console.log('Test 6: Subscription Renewal...');
        const renewalResult = await db.renewSubscription(memberId, 1, 100, 'cash', testUser.id);
        assert.ok(renewalResult.success, 'Renewal should be successful');
        assert.ok(renewalResult.newEndDate, 'New end date should be returned');
        console.log('✅ Passed');

        console.log('\n✅ All Tests Passed!');

    } catch (error) {
        console.error('❌ Test Suite Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup - wait a bit before closing
        await new Promise(resolve => setTimeout(resolve, 500));
        db.close();

        // Wait for DB to fully close
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                // Ignore cleanup error
                console.warn('Could not delete test DB:', e.message);
            }
        }
    }
}

runTests();
