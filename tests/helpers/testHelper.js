const ImprovedDatabase = require('../../database/improved_db');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

class TestHelper {
    constructor() {
        this.db = null;
        this.testDbPath = null;
    }

    /**
     * Create a fresh test database
     */
    async createTestDatabase() {
        const dbName = `test_${Date.now()}_${Math.random().toString(36).substring(7)}.db`;
        this.testDbPath = path.join(__dirname, '..', dbName);

        // Delete if exists
        if (fs.existsSync(this.testDbPath)) {
            fs.unlinkSync(this.testDbPath);
        }

        this.db = new ImprovedDatabase(this.testDbPath);

        // Wait longer for initialization - SQLite needs time to create tables and default users
        await new Promise(resolve => setTimeout(resolve, 2500));

        return this.db;
    }

    /**
     * Clean up test database
     */
    async cleanupTestDatabase() {
        if (this.db) {
            this.db.close();
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (this.testDbPath && fs.existsSync(this.testDbPath)) {
            try {
                fs.unlinkSync(this.testDbPath);
            } catch (e) {
                console.warn('Could not delete test DB:', e.message);
            }
        }
    }

    /**
     * Create a test user
     */
    async createTestUser(username, password, role = 'staff', fullName = 'Test User') {
        const hashedPassword = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            this.db.db.run(
                `INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, 'active')`,
                [username, hashedPassword, fullName, role],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username, role, full_name: fullName });
                    }
                }
            );
        });
    }

    /**
     * Create a test member
     */
    async createTestMember(memberData, createdBy) {
        const defaultMember = {
            name: 'Test Member',
            email: `test${Math.random().toString(36).substring(7)}@example.com`,
            phone: `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
            membership_type: 'monthly',
            status: 'active',
            join_date: new Date().toISOString(),
            ...memberData
        };

        const user = createdBy || { id: 1 };
        return await this.db.addMember(defaultMember, user);
    }

    /**
     * Create a test trainer
     */
    async createTestTrainer(trainerData, createdBy) {
        const defaultTrainer = {
            name: 'Test Trainer',
            specialty: 'Fitness',
            email: `trainer${Math.random().toString(36).substring(7)}@example.com`,
            phone: `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
            status: 'active',
            ...trainerData
        };

        const user = createdBy || { id: 1 };
        return await this.db.addTrainer(defaultTrainer, user);
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT * FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    /**
     * Get member by ID
     */
    async getMemberById(id) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT * FROM members WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    /**
     * Count records in a table
     */
    async countRecords(tableName) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                `SELECT COUNT(*) as count FROM ${tableName}`,
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row.count);
                    }
                }
            );
        });
    }
}

module.exports = TestHelper;
