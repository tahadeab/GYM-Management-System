const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'gym.db'));
        this.init();
    }

    init() {
        // إنشاء جدول المستخدمين
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'staff',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // إنشاء جدول الأعضاء
        this.db.run(`
            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                membership_type TEXT DEFAULT 'monthly',
                photo TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // إنشاء جدول المدربين
        this.db.run(`
            CREATE TABLE IF NOT EXISTS trainers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                specialty TEXT,
                phone TEXT,
                email TEXT,
                schedule TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // إنشاء جدول الاشتراكات
        this.db.run(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                plan TEXT NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                amount REAL NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (member_id) REFERENCES members (id)
            )
        `);

        // إنشاء جدول الحضور
        this.db.run(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
                check_out DATETIME,
                FOREIGN KEY (member_id) REFERENCES members (id)
            )
        `);

        // إنشاء جدول المدفوعات
        this.db.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER,
                amount REAL NOT NULL,
                payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                method TEXT DEFAULT 'cash',
                description TEXT,
                FOREIGN KEY (member_id) REFERENCES members (id)
            )
        `);

        // إنشاء جدول المعدات
        this.db.run(`
            CREATE TABLE IF NOT EXISTS equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'available',
                last_maintenance DATETIME,
                notes TEXT
            )
        `);

        // إنشاء جدول الحصص
        this.db.run(`
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                trainer_id INTEGER,
                schedule TEXT,
                capacity INTEGER DEFAULT 20,
                current_attendees INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (trainer_id) REFERENCES trainers (id)
            )
        `);

        // إضافة مستخدم افتراضي (admin/admin)
        this.createDefaultUser();
    }

    async createDefaultUser() {
        const hashedPassword = await bcrypt.hash('admin', 10);
        this.db.run(`
            INSERT OR IGNORE INTO users (username, password, role) 
            VALUES ('admin', ?, 'admin')
        `, [hashedPassword]);
    }

    // دوال إدارة المستخدمين
    async authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const isValid = await bcrypt.compare(password, row.password);
                    resolve(isValid ? row : null);
                }
            });
        });
    }

    // دوال إدارة الأعضاء
    getAllMembers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM members ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    addMember(member) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO members (name, phone, email, membership_type, photo)
                VALUES (?, ?, ?, ?, ?)
            `, [member.name, member.phone, member.email, member.membership_type, member.photo], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    updateMember(id, member) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE members 
                SET name = ?, phone = ?, email = ?, membership_type = ?, photo = ?, status = ?
                WHERE id = ?
            `, [member.name, member.phone, member.email, member.membership_type, member.photo, member.status, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    deleteMember(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM members WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // دوال إدارة المدربين
    getAllTrainers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM trainers ORDER BY created_at DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    addTrainer(trainer) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO trainers (name, specialty, phone, email, schedule)
                VALUES (?, ?, ?, ?, ?)
            `, [trainer.name, trainer.specialty, trainer.phone, trainer.email, trainer.schedule], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // دوال إدارة الاشتراكات
    getMemberSubscriptions(memberId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM subscriptions WHERE member_id = ? ORDER BY created_at DESC', [memberId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    addSubscription(subscription) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO subscriptions (member_id, plan, start_date, end_date, amount)
                VALUES (?, ?, ?, ?, ?)
            `, [subscription.member_id, subscription.plan, subscription.start_date, subscription.end_date, subscription.amount], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // دوال إدارة الحضور
    checkIn(memberId) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO attendance (member_id) VALUES (?)', [memberId], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    checkOut(memberId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE attendance 
                SET check_out = CURRENT_TIMESTAMP 
                WHERE member_id = ? AND check_out IS NULL
            `, [memberId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // دوال إدارة المدفوعات
    addPayment(payment) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO payments (member_id, amount, method, description)
                VALUES (?, ?, ?, ?)
            `, [payment.member_id, payment.amount, payment.method, payment.description], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    getPayments(memberId = null) {
        return new Promise((resolve, reject) => {
            const query = memberId 
                ? 'SELECT * FROM payments WHERE member_id = ? ORDER BY payment_date DESC'
                : 'SELECT * FROM payments ORDER BY payment_date DESC';
            const params = memberId ? [memberId] : [];
            
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // دوال التقارير
    getDashboardStats() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
                    (SELECT COUNT(*) FROM trainers WHERE status = 'active') as active_trainers,
                    (SELECT COUNT(*) FROM payments WHERE date(payment_date) = date('now')) as today_payments,
                    (SELECT COUNT(*) FROM attendance WHERE date(check_in) = date('now')) as today_attendance
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = new Database(); 