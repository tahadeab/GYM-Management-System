const ImprovedDatabase = require('../database/improved_db');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const testDbPath = path.join(__dirname, 'test_rbac.db');

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
    console.log('Starting RBAC & Isolation Tests...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB init

    try {
        // 1. Setup Users
        const admin = await createUser('admin_test', 'admin');
        const managerA = await createUser('manager_a', 'staff'); // Using 'staff' as manager role for now
        const managerB = await createUser('manager_b', 'staff');

        console.log('Users created:', { admin: admin.id, managerA: managerA.id, managerB: managerB.id });

        // 2. Manager A creates a member
        // Note: We need to modify addMember to accept a creator/user context, 
        // but currently it doesn't enforce it in the DB insert explicitly via arguments in the same way we want.
        // However, the current addMember implementation DOES NOT take a user argument to set created_by.
        // We need to fix that first or manually insert for the test to prove the read isolation.
        // Let's manually insert to simulate "Manager A created this" if addMember doesn't support it yet.

        // Wait, looking at improved_db.js, addMember DOES NOT take a user argument. 
        // It has a 'created_by' column in schema but doesn't seem to set it in addMember method!
        // This is part of the problem.

        // Let's manually insert a member with created_by = managerA.id
        await new Promise((resolve, reject) => {
            db.db.run(`INSERT INTO members (name, created_by, status) VALUES (?, ?, 'active')`,
                ['Member Created By A', managerA.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // 3. Manager B tries to list members
        // Current getAllMembers does not take a user argument.
        // We will pass it anyway to see if it's ignored (it is).
        const membersSeenByB = await db.getAllMembers(managerB);

        console.log('Members seen by Manager B:', membersSeenByB.length);

        // EXPECTATION FOR REPRODUCTION: Manager B sees the member (Isolation Failure)
        if (membersSeenByB.length > 0) {
            console.log('⚠️  Isolation Failure Reproduced: Manager B can see Manager A\'s members.');
        } else {
            console.log('✅ Isolation Working (Unexpectedly?)');
        }

        // 4. Admin tries to list members
        const membersSeenByAdmin = await db.getAllMembers(admin);
        console.log('Members seen by Admin:', membersSeenByAdmin.length);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        db.close();
        // fs.unlinkSync(testDbPath); // Keep for inspection if needed
    }
}

runTests();
