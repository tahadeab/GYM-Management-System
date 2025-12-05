const ImprovedDatabase = require('../database/improved_db');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const testDbPath = path.join(__dirname, 'test_rbac_comprehensive.db');

if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
}

const db = new ImprovedDatabase(testDbPath);

async function createUser(username, role) {
    const password = await bcrypt.hash('password', 10);
    return new Promise((resolve, reject) => {
        db.db.run(`INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, 'active')`,
            [username, password, username, role], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, role });
            });
    });
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE RBAC & DATA ISOLATION TEST SUITE');
    console.log('='.repeat(60));

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // ===== SETUP =====
        console.log('\n📋 SETUP: Creating test users...');
        const admin = await createUser('admin_test', 'admin');
        const managerA = await createUser('manager_a', 'staff');
        const managerB = await createUser('manager_b', 'staff');
        console.log(`✅ Created: Admin (ID: ${admin.id}), Manager A (ID: ${managerA.id}), Manager B (ID: ${managerB.id})`);

        // ===== TEST 1: Member Data Isolation =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 1: Member Data Isolation');
        console.log('='.repeat(60));

        // Manager A creates a member
        const memberA = await db.addMember({
            name: 'Member Created By A',
            email: 'membera@gym.com',
            phone: '1111111111',
            status: 'active'
        }, managerA);
        console.log(`✅ Manager A created member (ID: ${memberA})`);

        // Manager B creates a member
        const memberB = await db.addMember({
            name: 'Member Created By B',
            email: 'memberb@gym.com',
            phone: '2222222222',
            status: 'active'
        }, managerB);
        console.log(`✅ Manager B created member (ID: ${memberB})`);

        // Manager A should only see their own member
        const membersSeenByA = await db.getAllMembers(managerA);
        assert.strictEqual(membersSeenByA.length, 1, 'Manager A should see only 1 member');
        assert.strictEqual(membersSeenByA[0].id, memberA, 'Manager A should see their own member');
        console.log(`✅ Manager A sees only their member (Count: ${membersSeenByA.length})`);

        // Manager B should only see their own member
        const membersSeenByB = await db.getAllMembers(managerB);
        assert.strictEqual(membersSeenByB.length, 1, 'Manager B should see only 1 member');
        assert.strictEqual(membersSeenByB[0].id, memberB, 'Manager B should see their own member');
        console.log(`✅ Manager B sees only their member (Count: ${membersSeenByB.length})`);

        // Admin should see all members
        const membersSeenByAdmin = await db.getAllMembers(admin);
        assert.strictEqual(membersSeenByAdmin.length, 2, 'Admin should see all 2 members');
        console.log(`✅ Admin sees all members (Count: ${membersSeenByAdmin.length})`);

        // ===== TEST 2: Trainer Data Isolation =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 2: Trainer Data Isolation');
        console.log('='.repeat(60));

        // Manager A creates a trainer
        const trainerA = await db.addTrainer({
            name: 'Trainer Created By A',
            specialty: 'Yoga',
            email: 'trainera@gym.com'
        }, managerA);
        console.log(`✅ Manager A created trainer (ID: ${trainerA})`);

        // Manager B creates a trainer
        const trainerB = await db.addTrainer({
            name: 'Trainer Created By B',
            specialty: 'CrossFit',
            email: 'trainerb@gym.com'
        }, managerB);
        console.log(`✅ Manager B created trainer (ID: ${trainerB})`);

        // Manager A should only see their own trainer
        const trainersSeenByA = await db.getAllTrainers(managerA);
        assert.strictEqual(trainersSeenByA.length, 1, 'Manager A should see only 1 trainer');
        assert.strictEqual(trainersSeenByA[0].id, trainerA, 'Manager A should see their own trainer');
        console.log(`✅ Manager A sees only their trainer (Count: ${trainersSeenByA.length})`);

        // Manager B should only see their own trainer
        const trainersSeenByB = await db.getAllTrainers(managerB);
        assert.strictEqual(trainersSeenByB.length, 1, 'Manager B should see only 1 trainer');
        assert.strictEqual(trainersSeenByB[0].id, trainerB, 'Manager B should see their own trainer');
        console.log(`✅ Manager B sees only their trainer (Count: ${trainersSeenByB.length})`);

        // Admin should see all trainers
        const trainersSeenByAdmin = await db.getAllTrainers(admin);
        assert.strictEqual(trainersSeenByAdmin.length, 2, 'Admin should see all 2 trainers');
        console.log(`✅ Admin sees all trainers (Count: ${trainersSeenByAdmin.length})`);

        // ===== TEST 3: Payment Data Isolation =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 3: Payment Data Isolation');
        console.log('='.repeat(60));

        // Manager A processes a payment
        const paymentA = await db.addPayment({
            member_id: memberA,
            amount: 100,
            method: 'cash',
            description: 'Payment by Manager A',
            processed_by: managerA.id
        });
        console.log(`✅ Manager A processed payment (ID: ${paymentA})`);

        // Manager B processes a payment
        const paymentB = await db.addPayment({
            member_id: memberB,
            amount: 200,
            method: 'card',
            description: 'Payment by Manager B',
            processed_by: managerB.id
        });
        console.log(`✅ Manager B processed payment (ID: ${paymentB})`);

        // Manager A should only see their own payment
        const paymentsSeenByA = await db.getPayments(managerA);
        assert.strictEqual(paymentsSeenByA.length, 1, 'Manager A should see only 1 payment');
        console.log(`✅ Manager A sees only their payment (Count: ${paymentsSeenByA.length})`);

        // Manager B should only see their own payment
        const paymentsSeenByB = await db.getPayments(managerB);
        assert.strictEqual(paymentsSeenByB.length, 1, 'Manager B should see only 1 payment');
        console.log(`✅ Manager B sees only their payment (Count: ${paymentsSeenByB.length})`);

        // Admin should see all payments
        const paymentsSeenByAdmin = await db.getPayments(admin);
        assert.strictEqual(paymentsSeenByAdmin.length, 2, 'Admin should see all 2 payments');
        console.log(`✅ Admin sees all payments (Count: ${paymentsSeenByAdmin.length})`);

        // ===== TEST 4: User Management Authorization =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 4: User Management Authorization');
        console.log('='.repeat(60));

        // Manager should NOT be able to view users list
        try {
            await db.getUsers(managerA);
            console.error('❌ FAILED: Manager should not be able to view users');
            assert.fail('Manager should not be able to view users');
        } catch (err) {
            assert.ok(err.message.includes('غير مصرح'), 'Error should indicate unauthorized access');
            console.log('✅ Manager A blocked from viewing users list');
        }

        // Admin should be able to view users list
        const usersSeenByAdmin = await db.getUsers(admin);
        assert.ok(usersSeenByAdmin.length >= 3, 'Admin should see at least 3 users');
        console.log(`✅ Admin can view users list (Count: ${usersSeenByAdmin.length})`);

        // ===== TEST 5: Dashboard Stats Isolation =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 5: Dashboard Stats Isolation');
        console.log('='.repeat(60));

        const statsA = await db.getDashboardStats(managerA);
        assert.strictEqual(statsA.total_members, 1, 'Manager A stats should show 1 member');
        assert.strictEqual(statsA.active_trainers, 1, 'Manager A stats should show 1 trainer');
        console.log(`✅ Manager A stats: ${statsA.total_members} members, ${statsA.active_trainers} trainers`);

        const statsB = await db.getDashboardStats(managerB);
        assert.strictEqual(statsB.total_members, 1, 'Manager B stats should show 1 member');
        assert.strictEqual(statsB.active_trainers, 1, 'Manager B stats should show 1 trainer');
        console.log(`✅ Manager B stats: ${statsB.total_members} members, ${statsB.active_trainers} trainers`);

        const statsAdmin = await db.getDashboardStats(admin);
        assert.strictEqual(statsAdmin.total_members, 2, 'Admin stats should show 2 members');
        assert.strictEqual(statsAdmin.active_trainers, 2, 'Admin stats should show 2 trainers');
        console.log(`✅ Admin stats: ${statsAdmin.total_members} members, ${statsAdmin.active_trainers} trainers`);

        // ===== TEST 6: Subscription Renewal with Isolation =====
        console.log('\n' + '='.repeat(60));
        console.log('TEST 6: Subscription Renewal with Isolation');
        console.log('='.repeat(60));

        // Manager A renews subscription for their member
        const renewalA = await db.renewSubscription(memberA, 1, 150, 'cash', managerA.id);
        assert.ok(renewalA.success, 'Manager A should be able to renew their member subscription');
        console.log('✅ Manager A successfully renewed subscription for their member');

        // Verify the subscription was created with correct created_by
        const subCheck = await new Promise((resolve, reject) => {
            db.db.get('SELECT * FROM subscriptions WHERE member_id = ? ORDER BY created_at DESC LIMIT 1',
                [memberA], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });
        assert.strictEqual(subCheck.created_by, managerA.id, 'Subscription should be created by Manager A');
        console.log('✅ Subscription correctly attributed to Manager A');

        // ===== SUMMARY =====
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL RBAC & ISOLATION TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\nSummary:');
        console.log('  ✓ Member data isolation working');
        console.log('  ✓ Trainer data isolation working');
        console.log('  ✓ Payment data isolation working');
        console.log('  ✓ User management authorization working');
        console.log('  ✓ Dashboard stats isolation working');
        console.log('  ✓ Subscription creation attribution working');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await new Promise(resolve => setTimeout(resolve, 500));
        db.close();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fs.existsSync(testDbPath)) {
            try {
                fs.unlinkSync(testDbPath);
            } catch (e) {
                console.warn('Could not delete test DB:', e.message);
            }
        }
    }
}

runTests();
