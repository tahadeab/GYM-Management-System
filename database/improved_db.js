const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class ImprovedDatabase {
    constructor(dbPath) {
        const defaultPath = path.join(__dirname, 'gym_improved.db');
        this.dbPath = dbPath || defaultPath;
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    init() {
        this.db.serialize(() => {
            // جدول المستخدمين المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    phone TEXT,
                    role TEXT NOT NULL DEFAULT 'staff',
                    profile_image TEXT,
                    status TEXT DEFAULT 'active',
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // جدول الأعضاء المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    email TEXT,
                    date_of_birth DATE,
                    gender TEXT CHECK(gender IN ('male', 'female')),
                    address TEXT,
                    emergency_contact_name TEXT,
                    emergency_contact_phone TEXT,
                    medical_notes TEXT,
                    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_visit DATETIME,
                    membership_type TEXT DEFAULT 'monthly',
                    photo TEXT,
                    status TEXT DEFAULT 'active',
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // جدول المدربين المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS trainers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    specialty TEXT,
                    phone TEXT,
                    email TEXT,
                    hire_date DATE,
                    experience_years INTEGER,
                    certifications TEXT,
                    salary REAL,
                    schedule TEXT,
                    profile_image TEXT,
                    status TEXT DEFAULT 'active',
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // جدول الاشتراكات المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    plan TEXT NOT NULL,
                    start_date DATETIME NOT NULL,
                    end_date DATETIME NOT NULL,
                    amount REAL NOT NULL,
                    discount_type TEXT,
                    discount_value REAL DEFAULT 0,
                    sessions_remaining INTEGER,
                    is_frozen BOOLEAN DEFAULT 0,
                    freeze_start_date DATETIME,
                    freeze_end_date DATETIME,
                    status TEXT DEFAULT 'active',
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id),
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // جدول الحضور المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS attendance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
                    check_out DATETIME,
                    activity_type TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id)
                )
            `);

            // جدول المدفوعات المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    invoice_number TEXT UNIQUE,
                    amount REAL NOT NULL,
                    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    method TEXT DEFAULT 'cash',
                    status TEXT DEFAULT 'completed',
                    description TEXT,
                    processed_by INTEGER,
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id),
                    FOREIGN KEY (processed_by) REFERENCES users (id),
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // جدول المعدات المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS equipment (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    manufacturer TEXT,
                    model_number TEXT,
                    purchase_date DATE,
                    purchase_price REAL,
                    status TEXT DEFAULT 'available',
                    last_maintenance DATETIME,
                    next_maintenance DATETIME,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // جدول الحصص المحسن
            this.db.run(`
                CREATE TABLE IF NOT EXISTS classes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    trainer_id INTEGER,
                    schedule TEXT,
                    duration_minutes INTEGER DEFAULT 60,
                    capacity INTEGER DEFAULT 20,
                    current_attendees INTEGER DEFAULT 0,
                    price REAL DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (trainer_id) REFERENCES trainers (id)
                )
            `);

            // جدول حجوزات الحصص
            this.db.run(`
                CREATE TABLE IF NOT EXISTS class_bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    class_id INTEGER,
                    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'confirmed',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id),
                    FOREIGN KEY (class_id) REFERENCES classes (id)
                )
            `);

            // جدول الإشعارات
            this.db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    member_id INTEGER,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT DEFAULT 'info',
                    read_status BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (member_id) REFERENCES members (id)
                )
            `);

            // جدول الخصومات
            this.db.run(`
                CREATE TABLE IF NOT EXISTS discounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT CHECK(type IN ('percentage', 'fixed')),
                    value REAL NOT NULL,
                    start_date DATE,
                    end_date DATE,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // جدول سجل النشاطات
            this.db.run(`
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    table_name TEXT,
                    record_id INTEGER,
                    old_values TEXT,
                    new_values TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // جدول الإعدادات
            this.db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // جدول خطط التدريب
            this.db.run(`
                CREATE TABLE IF NOT EXISTS workout_plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    trainer_id INTEGER,
                    name TEXT NOT NULL,
                    description TEXT,
                    exercises TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id),
                    FOREIGN KEY (trainer_id) REFERENCES trainers (id)
                )
            `);

            // جدول التمارين
            this.db.run(`
                CREATE TABLE IF NOT EXISTS exercises (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT,
                    muscle_group TEXT,
                    description TEXT,
                    instructions TEXT,
                    image TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // جدول قياسات الجسم
            this.db.run(`
                CREATE TABLE IF NOT EXISTS body_measurements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    weight REAL,
                    height REAL,
                    body_fat_percentage REAL,
                    muscle_mass REAL,
                    measurement_date DATE DEFAULT CURRENT_DATE,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (member_id) REFERENCES members (id)
                )
            `);

            // إضافة الإعدادات الافتراضية
            this.insertDefaultSettings();

            // إضافة مستخدم افتراضي محسن
            this.createDefaultUser();
        });
    }

    async insertDefaultSettings() {
        const defaultSettings = [
            ['gym_name', 'نادي اللياقة البدنية', 'اسم النادي'],
            ['gym_address', '', 'عنوان النادي'],
            ['gym_phone', '', 'هاتف النادي'],
            ['gym_email', '', 'بريد النادي الإلكتروني'],
            ['currency', 'ريال', 'العملة المستخدمة'],
            ['session_timeout', '30', 'مهلة انتهاء الجلسة بالدقائق'],
            ['backup_frequency', 'daily', 'تكرار النسخ الاحتياطي'],
            ['notification_enabled', '1', 'تفعيل الإشعارات']
        ];

        defaultSettings.forEach(([key, value, description]) => {
            this.db.run(`
                INSERT OR IGNORE INTO settings (key, value, description) 
                VALUES (?, ?, ?)
            `, [key, value, description]);
        });
    }

    async createDefaultUser() {
        // التحقق من وجود المستخدم الافتراضي
        this.db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin'], async (err, existingUser) => {
            if (err) {
                console.error('Error checking for existing admin:', err);
                return;
            }

            if (!existingUser || existingUser.count === 0) {
                // Generate a random password if not provided in env
                const defaultPassword = process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                this.db.run(`
                    INSERT INTO users (username, password, full_name, role, status) 
                    VALUES ('admin', ?, 'المدير العام', 'admin', 'active')
                `, [hashedPassword], (err) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                        return;
                    }

                    if (!process.env.ADMIN_PASSWORD) {
                        console.warn('\x1b[33m%s\x1b[0m', '⚠️ SECURITY NOTICE: No ADMIN_PASSWORD env var found.');
                        console.warn('\x1b[33m%s\x1b[0m', `⚠️ Generated temporary admin password: ${defaultPassword}`);
                        console.warn('\x1b[33m%s\x1b[0m', '⚠️ Please change this password immediately after logging in.');
                    } else {
                        console.log('✅ Admin user created with provided environment variable password.');
                    }
                });
            }
        });

        // لا نضيف أي بيانات أخرى - النظام يبدأ فارغاً للعميل
        console.log('تم تهيئة النظام بنجاح - جاهز للاستخدام مع قاعدة بيانات فارغة');
    }

    // دوال إدارة المستخدمين المحسنة
    async authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ? AND status = "active"', [username], async (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const isValid = await bcrypt.compare(password, row.password);
                    if (isValid) {
                        // تحديث آخر تسجيل دخول
                        this.updateLastLogin(row.id);
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    updateLastLogin(userId) {
        this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    }

    async deleteUser(id) {
        return new Promise((resolve, reject) => {
            // Check if user is admin and if it's the last one
            this.db.get('SELECT role FROM users WHERE id = ?', [id], (err, user) => {
                if (err) return reject(err);
                if (!user) return reject(new Error('المستخدم غير موجود'));

                if (user.role === 'admin') {
                    this.db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND status = "active"', (err, row) => {
                        if (err) return reject(err);
                        if (row.count <= 1) {
                            return reject(new Error('لا يمكن حذف آخر مدير في النظام'));
                        }
                        // Proceed with deletion (soft delete)
                        this.db.run('UPDATE users SET status = "inactive" WHERE id = ?', [id], function (err) {
                            if (err) reject(err);
                            else resolve(this.changes);
                        });
                    });
                } else {
                    // Soft delete for non-admins
                    this.db.run('UPDATE users SET status = "inactive" WHERE id = ?', [id], function (err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    });
                }
            });
        });
    }

    async getUsers(currentUser) {
        return new Promise((resolve, reject) => {
            // Only admin can see all users. 
            // Managers (staff) should probably not see this list or only see themselves?
            // Requirement: "admins can see/change other admins’ data" implied admins manage users.
            // Managers shouldn't manage users.

            if (!currentUser || currentUser.role !== 'admin') {
                // Return empty list or error? Let's return only themselves to be safe/friendly
                // or just reject.
                // Given the UI likely expects a list, let's return just the current user if they ask,
                // or reject if it's a restricted page.
                // Let's assume strict RBAC: only admin sees users list.
                return reject(new Error('غير مصرح لك بعرض المستخدمين'));
            }

            this.db.all('SELECT id, username, full_name, role, status, last_login FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // دوال المدفوعات والاشتراكات
    async addPayment(payment) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO payments (
                    member_id, amount, method, status, description, processed_by, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                payment.member_id, payment.amount, payment.method || 'cash',
                'completed', payment.description, payment.processed_by, payment.processed_by // created_by same as processed_by
            ], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getPayments(user) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT p.*, m.name as member_name 
                FROM payments p 
                LEFT JOIN members m ON p.member_id = m.id 
            `;

            const params = [];

            if (user && user.role !== 'admin') {
                // Show payments processed by this user OR created by this user
                // OR payments for members created by this user?
                // Usually financial data is sensitive. 
                // Let's restrict to payments processed/created by this user.
                query += ` WHERE p.processed_by = ? OR p.created_by = ?`;
                params.push(user.id, user.id);
            }

            query += ` ORDER BY p.created_at DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async renewSubscription(memberId, durationMonths, amount, paymentMethod, processedBy) {
        if (!memberId) return Promise.reject(new Error('رقم العضو مطلوب'));
        if (durationMonths <= 0) return Promise.reject(new Error('مدة الاشتراك يجب أن تكون أكبر من صفر'));
        if (amount < 0) return Promise.reject(new Error('المبلغ لا يمكن أن يكون سالباً'));

        return new Promise((resolve, reject) => {
            const that = this;
            this.db.serialize(() => {
                that.db.run('BEGIN TRANSACTION');

                // 1. Get current subscription
                that.db.get('SELECT * FROM subscriptions WHERE member_id = ? AND status = "active"', [memberId], (err, sub) => {
                    if (err) {
                        that.db.run('ROLLBACK');
                        return reject(err);
                    }

                    // Calculate new dates
                    let startDate = new Date();
                    if (sub && new Date(sub.end_date) > startDate) {
                        startDate = new Date(sub.end_date);
                    }

                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + durationMonths);

                    // 2. Add Payment
                    that.db.run(`
                        INSERT INTO payments (member_id, amount, method, status, description, processed_by)
                        VALUES (?, ?, ?, 'completed', ?, ?)
                    `, [memberId, amount, paymentMethod, `تجديد اشتراك ${durationMonths} شهر`, processedBy], function (err) {
                        if (err) {
                            that.db.run('ROLLBACK');
                            return reject(err);
                        }

                        // 3. Update or Insert Subscription
                        if (sub) {
                            that.db.run(`
                                UPDATE subscriptions SET end_date = ?, updated_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                            `, [endDate.toISOString(), sub.id], function (err) {
                                if (err) {
                                    that.db.run('ROLLBACK');
                                    return reject(err);
                                }
                                that.db.run('COMMIT');
                                resolve({ success: true, newEndDate: endDate });
                            });
                        } else {
                            that.db.run(`
                                INSERT INTO subscriptions (member_id, plan, start_date, end_date, amount, status, created_by)
                                VALUES (?, 'monthly', ?, ?, ?, 'active', ?)
                            `, [memberId, startDate.toISOString(), endDate.toISOString(), amount, processedBy], function (err) {
                                if (err) {
                                    that.db.run('ROLLBACK');
                                    return reject(err);
                                }
                                that.db.run('COMMIT');
                                resolve({ success: true, newEndDate: endDate });
                            });
                        }
                    });
                });
            });
        });
    }
    async getAllMembers(user) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT m.*, 
                       s.end_date as subscription_end_date,
                       s.status as subscription_status,
                       u.full_name as created_by_name
                FROM members m
                LEFT JOIN subscriptions s ON m.id = s.member_id AND s.status = 'active'
                LEFT JOIN users u ON m.created_by = u.id
            `;

            const params = [];

            // If not admin, only show members created by this user
            if (user && user.role !== 'admin') {
                query += ` WHERE m.created_by = ?`;
                params.push(user.id);
            }

            query += ` ORDER BY m.created_at DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    validateMember(member) {
        if (!member.name || member.name.trim() === '') return 'اسم العضو مطلوب';
        if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) return 'البريد الإلكتروني غير صالح';
        if (member.phone && !/^\d{9,15}$/.test(member.phone)) return 'رقم الهاتف غير صالح';
        return null;
    }

    async addMember(member, user) {
        const validationError = this.validateMember(member);
        if (validationError) return Promise.reject(new Error(validationError));

        return new Promise((resolve, reject) => {
            // Check for duplicate email/phone
            this.db.get('SELECT id FROM members WHERE email = ? OR phone = ?', [member.email, member.phone], (err, row) => {
                if (err) return reject(err);
                if (row) return reject(new Error('العضو موجود بالفعل (البريد الإلكتروني أو الهاتف مكرر)'));

                const that = this;
                that.db.serialize(() => {
                    // Use BEGIN TRANSACTION
                    that.db.run('BEGIN TRANSACTION', (err) => {
                        if (err) return reject(err);

                        // Double check inside transaction for extra safety
                        that.db.get('SELECT id FROM members WHERE email = ? OR phone = ?', [member.email, member.phone], (err, row) => {
                            if (err) {
                                that.db.run('ROLLBACK');
                                return reject(err);
                            }
                            if (row) {
                                that.db.run('ROLLBACK');
                                return reject(new Error('العضو موجود بالفعل (البريد الإلكتروني أو الهاتف مكرر)'));
                            }

                            that.db.run(`
                                INSERT INTO members (
                                    name, phone, email, date_of_birth, gender, address,
                                    emergency_contact_name, emergency_contact_phone, medical_notes,
                                    membership_type, photo, join_date, status, created_by
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                member.name, member.phone, member.email, member.date_of_birth,
                                member.gender, member.address, member.emergency_contact_name,
                                member.emergency_contact_phone, member.medical_notes,
                                member.membership_type, member.photo, member.join_date, member.status,
                                user ? user.id : null
                            ], function (err) {
                                if (err) {
                                    that.db.run('ROLLBACK');
                                    return reject(err);
                                }

                                const memberId = this.lastID;

                                if (member.expiryDate) {
                                    that.db.run(`
                                        INSERT INTO subscriptions (
                                            member_id, plan, start_date, end_date, amount, status, created_by
                                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                                    `, [
                                        memberId,
                                        member.membership_type || 'monthly',
                                        member.join_date || new Date().toISOString(),
                                        member.expiryDate,
                                        0, // Default amount 0 for now
                                        'active',
                                        user ? user.id : null
                                    ], (err) => {
                                        if (err) {
                                            that.db.run('ROLLBACK');
                                            return reject(err);
                                        }
                                        that.db.run('COMMIT');
                                        resolve(memberId);
                                    });
                                } else {
                                    that.db.run('COMMIT');
                                    resolve(memberId);
                                }
                            });
                        });
                    });
                });
            });
        });
    }

    async updateMember(id, member, user) {
        return new Promise((resolve, reject) => {
            const that = this;

            // First check ownership if not admin
            if (user && user.role !== 'admin') {
                this.db.get('SELECT created_by FROM members WHERE id = ?', [id], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('العضو غير موجود'));
                    if (row.created_by !== user.id) {
                        return reject(new Error('غير مصرح لك بتحديث هذا العضو'));
                    }
                    performUpdate();
                });
            } else {
                performUpdate();
            }

            function performUpdate() {
                that.db.serialize(() => {
                    that.db.run('BEGIN TRANSACTION');

                    that.db.run(`
                        UPDATE members SET 
                            name = ?, phone = ?, email = ?, date_of_birth = ?, gender = ?,
                            address = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
                            medical_notes = ?, membership_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [
                        member.name, member.phone, member.email, member.date_of_birth,
                        member.gender, member.address, member.emergency_contact_name,
                        member.emergency_contact_phone, member.medical_notes,
                        member.membership_type, member.status, id
                    ], function (err) {
                        if (err) {
                            that.db.run('ROLLBACK');
                            return reject(err);
                        }

                        if (member.expiryDate) {
                            // Update active subscription
                            that.db.run(`
                                UPDATE subscriptions SET end_date = ?, updated_at = CURRENT_TIMESTAMP
                                WHERE member_id = ? AND status = 'active'
                            `, [member.expiryDate, id], (err) => {
                                if (err) {
                                    that.db.run('ROLLBACK');
                                    return reject(err);
                                }
                                that.db.run('COMMIT');
                                resolve(this.changes);
                            });
                        } else {
                            that.db.run('COMMIT');
                            resolve(this.changes);
                        }
                    });
                });
            }
        });
    }

    // دوال إدارة المدربين
    async getAllTrainers(user) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM trainers';
            const params = [];

            if (user && user.role !== 'admin') {
                query += ' WHERE created_by = ?';
                params.push(user.id);
            }

            query += ' ORDER BY created_at DESC';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async addTrainer(trainer, user) {
        if (!trainer.name) return Promise.reject(new Error('اسم المدرب مطلوب'));

        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO trainers (
                    name, specialty, phone, email, hire_date, experience_years,
                    certifications, salary, schedule, profile_image, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                trainer.name, trainer.specialty, trainer.phone, trainer.email,
                trainer.hire_date, trainer.experience_years, trainer.certifications,
                trainer.salary, trainer.schedule, trainer.profile_image, trainer.status || 'active',
                user ? user.id : null
            ], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async updateTrainer(id, trainer, user) {
        if (!trainer.name) return Promise.reject(new Error('اسم المدرب مطلوب'));
        if (trainer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainer.email)) return Promise.reject(new Error('البريد الإلكتروني غير صالح'));
        if (trainer.phone && !/^\d{9,15}$/.test(trainer.phone)) return Promise.reject(new Error('رقم الهاتف غير صالح'));

        return new Promise((resolve, reject) => {
            const that = this;

            // First check ownership if not admin
            if (user && user.role !== 'admin') {
                this.db.get('SELECT created_by FROM trainers WHERE id = ?', [id], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('المدرب غير موجود'));
                    if (row.created_by !== user.id) {
                        return reject(new Error('غير مصرح لك بتحديث هذا المدرب'));
                    }
                    performUpdate();
                });
            } else {
                performUpdate();
            }

            function performUpdate() {
                // Check for duplicate email/phone excluding current trainer
                that.db.get('SELECT id FROM trainers WHERE (email = ? OR phone = ?) AND id != ?',
                    [trainer.email, trainer.phone, id], (err, row) => {
                        if (err) return reject(err);
                        if (row) return reject(new Error('المدرب موجود بالفعل (البريد الإلكتروني أو الهاتف مكرر)'));

                        that.db.run(`
                        UPDATE trainers SET 
                            name = ?, specialty = ?, phone = ?, email = ?, hire_date = ?,
                            experience_years = ?, certifications = ?, salary = ?, schedule = ?,
                            profile_image = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [
                            trainer.name, trainer.specialty, trainer.phone, trainer.email,
                            trainer.hire_date, trainer.experience_years, trainer.certifications,
                            trainer.salary, trainer.schedule, trainer.profile_image, trainer.status, id
                        ], function (err) {
                            if (err) reject(err);
                            else resolve(this.changes);
                        });
                    });
            }
        });
    }

    async deleteTrainer(id, user) {
        return new Promise((resolve, reject) => {
            // First check ownership if not admin
            if (user && user.role !== 'admin') {
                this.db.get('SELECT created_by FROM trainers WHERE id = ?', [id], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('المدرب غير موجود'));
                    if (row.created_by !== user.id) {
                        return reject(new Error('غير مصرح لك بحذف هذا المدرب'));
                    }
                    performDelete();
                });
            } else {
                performDelete();
            }

            const that = this;
            function performDelete() {
                that.db.run('DELETE FROM trainers WHERE id = ?', [id], function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            }
        });
    }

    async deleteMember(id, user) {
        return new Promise((resolve, reject) => {
            // First check ownership if not admin
            if (user && user.role !== 'admin') {
                this.db.get('SELECT created_by FROM members WHERE id = ?', [id], (err, row) => {
                    if (err) return reject(err);
                    if (!row) return reject(new Error('العضو غير موجود'));
                    if (row.created_by !== user.id) {
                        return reject(new Error('غير مصرح لك بحذف هذا العضو'));
                    }
                    performDelete();
                });
            } else {
                performDelete();
            }

            const that = this;
            function performDelete() {
                that.db.run('DELETE FROM members WHERE id = ?', [id], function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            }
        });
    }

    // دوال التقارير المحسنة
    async getDashboardStats(user) {
        return new Promise((resolve, reject) => {
            const userId = user && user.role !== 'admin' ? user.id : null;

            // Build filter conditions
            const memberFilter = userId ? `WHERE created_by = ${userId}` : '';
            const memberFilterAnd = userId ? `AND created_by = ${userId}` : '';
            const trainerFilter = userId ? `WHERE created_by = ${userId} AND status = 'active'` : 'WHERE status = \'active\'';
            const paymentFilter = userId ? `AND (processed_by = ${userId} OR created_by = ${userId})` : '';
            const subFilter = userId ? `AND created_by = ${userId}` : '';

            // Attendance filtering - join with members to filter by member creator
            const attendanceJoin = userId ? `JOIN members m ON attendance.member_id = m.id` : '';
            const attendanceFilter = userId ? `AND m.created_by = ${userId}` : '';

            this.db.get(`
                SELECT
                    (SELECT COUNT(*) FROM members ${memberFilter}) as total_members,
                    (SELECT COUNT(*) FROM members WHERE status = 'active' ${memberFilterAnd}) as active_members,
                    (SELECT COUNT(*) FROM trainers ${trainerFilter}) as active_trainers,
                    (SELECT COUNT(*) FROM payments WHERE date(payment_date) = date('now') ${paymentFilter}) as today_payments,
                    (SELECT COUNT(*) FROM attendance ${attendanceJoin} WHERE date(check_in) = date('now') ${attendanceFilter}) as today_attendance,
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE date(payment_date) = date('now') ${paymentFilter}) as today_revenue,
                    (SELECT COUNT(*) FROM subscriptions WHERE end_date < date('now') AND status = 'active' ${subFilter}) as expired_subscriptions
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // دوال إدارة الإشعارات
    async addNotification(notification) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO notifications(user_id, member_id, title, message, type)
        VALUES(?, ?, ?, ?, ?)
            `, [notification.user_id, notification.member_id, notification.title, notification.message, notification.type], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getUnreadNotifications(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
        SELECT * FROM notifications 
                WHERE user_id = ? AND read_status = 0 
                ORDER BY created_at DESC
            `, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // دوال إدارة الإعدادات
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.value : null);
            });
        });
    }

    async updateSetting(key, value) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE key = ?
            `, [value, key], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = ImprovedDatabase;

