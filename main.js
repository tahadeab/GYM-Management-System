const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure userData directory exists
const userDataPath = app.getPath('userData');
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
}

// Use a persistent database path in userData
const dbPath = path.join(userDataPath, 'gym_improved.db');
const Database = require('./database/improved_db');
const db = new Database(dbPath);

// تعطيل تحذيرات الأمان في بيئة التطوير
// تعطيل تحذيرات الأمان في بيئة التطوير
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

class GymManagementApp {
    constructor() {
        this.mainWindow = null;
        this.isDev = process.env.NODE_ENV === 'development';
        this.currentUser = null; // Store logged in user
        this.init();
    }

    init() {
        this.setupApp();
        this.setupDatabase();
        this.setupIPC();
        this.notificationTimer = setInterval(() => db.generateSubscriptionNotifications().catch(err => console.error('Notification sweep failed:', err)), 24 * 60 * 60 * 1000);
        db.generateSubscriptionNotifications().catch(err => console.error('Initial notification sweep failed:', err));
    }

    setupApp() {
        // إعداد التطبيق
        app.whenReady().then(() => {
            this.createMainWindow();
            this.createMenu();

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        // معالجة الأخطاء غير المتوقعة
        process.on('uncaughtException', (error) => {
            console.error('خطأ غير متوقع:', error);
            this.showErrorDialog('حدث خطأ غير متوقع', error.message);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('رفض غير معالج:', reason);
        });
    }

    createMainWindow() {
        // إنشاء النافذة الرئيسية
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            icon: path.join(__dirname, 'assets', 'gym-logo.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                webSecurity: true,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'default',
            show: false,
            backgroundColor: '#f8f9fa'
        });

        // تحميل صفحة تسجيل الدخول المحسنة الاحترافية
        this.mainWindow.loadFile(path.join(__dirname, 'frontend', 'professional_login.html'));

        // إظهار النافذة عند اكتمال التحميل
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();

            if (this.isDev) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // معالجة إغلاق النافذة
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // معالجة أخطاء التحميل
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('فشل في تحميل الصفحة:', errorDescription);
        });

        // معالجة الروابط الخارجية
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            // Only allow http and https protocols
            if (url.startsWith('http:') || url.startsWith('https:')) {
                shell.openExternal(url);
            }
            return { action: 'deny' };
        });
    }

    createMenu() {
        const template = [
            {
                label: 'ملف',
                submenu: [
                    {
                        label: 'صفحة جديدة',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.createMainWindow();
                        }
                    },
                    {
                        label: 'إعادة تحميل',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => {
                            if (this.mainWindow) {
                                this.mainWindow.reload();
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'تصدير البيانات',
                        click: () => {
                            this.exportData();
                        }
                    },
                    {
                        label: 'استيراد البيانات',
                        click: () => {
                            this.importData();
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'خروج',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'عرض',
                submenu: [
                    { label: 'إعادة تحميل', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                    { label: 'أدوات المطور', accelerator: 'F12', role: 'toggleDevTools' },
                    { type: 'separator' },
                    { label: 'ملء الشاشة', accelerator: 'F11', role: 'togglefullscreen' }
                ]
            },
            {
                label: 'مساعدة',
                submenu: [
                    {
                        label: 'حول التطبيق',
                        click: () => {
                            this.showAboutDialog();
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    async setupDatabase() {
        try {
            await db.init();
            console.log('تم تهيئة قاعدة البيانات بنجاح');
        } catch (error) {
            console.error('خطأ في تهيئة قاعدة البيانات:', error);
            this.showErrorDialog('خطأ في قاعدة البيانات', 'فشل في تهيئة قاعدة البيانات. يرجى التحقق من الملفات والمحاولة مرة أخرى.');
        }
    }

    setupIPC() {
        // معالجة تسجيل الدخول
        ipcMain.handle('login', async (event, credentials) => {
            try {
                const result = await db.authenticateUser(credentials.username, credentials.password);
                if (result) {
                    this.currentUser = result; // Set current user
                    return { success: true, user: result };
                } else {
                    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
                }
            } catch (error) {
                console.error('خطأ في تسجيل الدخول:', error);
                return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
            }
        });

        // معالجة الأعضاء
        ipcMain.handle('get-members', async () => {
            try {
                return await db.getAllMembers(this.currentUser);
            } catch (error) {
                console.error('خطأ في جلب الأعضاء:', error);
                throw error;
            }
        });

        ipcMain.handle('add-member', async (event, memberData) => {
            try {
                return await db.addMember(memberData, this.currentUser);
            } catch (error) {
                console.error('خطأ في إضافة عضو:', error);
                throw error;
            }
        });

        ipcMain.handle('update-member', async (event, { id, data }) => {
            try {
                if (!this.currentUser) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }
                return await db.updateMember(id, data, this.currentUser);
            } catch (error) {
                console.error('خطأ في تحديث عضو:', error);
                throw error;
            }
        });

        ipcMain.handle('delete-member', async (event, id) => {
            try {
                if (!this.currentUser) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }
                return await db.deleteMember(id, this.currentUser);
            } catch (error) {
                console.error('خطأ في حذف عضو:', error);
                throw error;
            }
        });

        // معالجة المدربين
        ipcMain.handle('get-trainers', async () => {
            try {
                return await db.getAllTrainers(this.currentUser);
            } catch (error) {
                console.error('خطأ في جلب المدربين:', error);
                throw error;
            }
        });

        ipcMain.handle('add-trainer', async (event, trainer) => {
            try {
                return await db.addTrainer(trainer, this.currentUser);
            } catch (error) {
                console.error('خطأ في إضافة مدرب:', error);
                throw error;
            }
        });

        ipcMain.handle('update-trainer', async (event, { id, trainer }) => {
            try {
                if (!this.currentUser) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }
                return await db.updateTrainer(id, trainer, this.currentUser);
            } catch (error) {
                console.error('خطأ في تحديث مدرب:', error);
                throw error;
            }
        });

        ipcMain.handle('delete-trainer', async (event, id) => {
            try {
                if (!this.currentUser) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }
                return await db.deleteTrainer(id, this.currentUser);
            } catch (error) {
                console.error('خطأ في حذف مدرب:', error);
                throw error;
            }
        });

        // معالجة المستخدمين (Admin)
        ipcMain.handle('get-users', async () => {
            try {
                return await db.getUsers(this.currentUser);
            } catch (error) {
                console.error('خطأ في جلب المستخدمين:', error);
                throw error;
            }
        });

        ipcMain.handle('delete-user', async (event, id) => {
            try {
                if (!this.currentUser || this.currentUser.role !== 'admin') {
                    throw new Error('غير مصرح لك بحذف المستخدمين');
                }
                return await db.deleteUser(id);
            } catch (error) {
                console.error('خطأ في حذف مستخدم:', error);
                throw error;
            }
        });

        // معالجة الاشتراكات والمدفوعات
        ipcMain.handle('renew-subscription', async (event, data) => {
            try {
                if (!this.currentUser) {
                    throw new Error('يجب تسجيل الدخول أولاً');
                }
                return await db.renewSubscription(
                    data.memberId,
                    data.durationMonths,
                    data.amount,
                    data.paymentMethod,
                    this.currentUser.id,
                    this.currentUser
                );
            } catch (error) {
                console.error('خطأ في تجديد الاشتراك:', error);
                throw error;
            }
        });

        ipcMain.handle('get-subscriptions', async () => db.getSubscriptionSummary(this.currentUser));
        ipcMain.handle('get-expiring-subscriptions', async (event, days) => db.getExpiringSubscriptions(this.currentUser, days));
        ipcMain.handle('freeze-subscription', async (event, data) => db.freezeSubscription(data.id, data.freezeUntil, this.currentUser));
        ipcMain.handle('unfreeze-subscription', async (event, id) => db.unfreezeSubscription(id, this.currentUser));
        ipcMain.handle('get-notifications', async () => db.getUnreadNotifications(this.currentUser && this.currentUser.id));
        ipcMain.handle('mark-notification-read', async (event, id) => db.markNotificationRead(id, this.currentUser && this.currentUser.id));
        ipcMain.handle('run-notification-sweep', async () => db.generateSubscriptionNotifications(this.currentUser && this.currentUser.id));

        ipcMain.handle('get-payments', async () => {
            try {
                return await db.getPayments(this.currentUser);
            } catch (error) {
                console.error('خطأ في جلب المدفوعات:', error);
                throw error;
            }
        });

        // معالجة الإحصائيات
        ipcMain.handle('get-dashboard-stats', async () => {
            if (!this.currentUser) throw new Error('Authentication required');
            return db.getDashboardStats(this.currentUser);
        });

        ipcMain.handle('get-attendance', async (event, options) => db.getAttendance(this.currentUser, options));
        ipcMain.handle('check-in', async (event, data) => db.checkIn(data.memberId, data.activityType, data.notes, this.currentUser));
        ipcMain.handle('check-out', async (event, id) => db.checkOut(id, this.currentUser));
        ipcMain.handle('get-equipment', async () => db.getEquipment(this.currentUser));
        ipcMain.handle('save-equipment', async (event, data) => db.saveEquipment(data, this.currentUser));
        ipcMain.handle('delete-equipment', async (event, id) => db.deleteEquipment(id, this.currentUser));
        ipcMain.handle('get-rooms', async () => db.getRooms(this.currentUser));
        ipcMain.handle('save-room', async (event, data) => db.saveRoom(data, this.currentUser));
        ipcMain.handle('delete-room', async (event, id) => db.deleteRoom(id, this.currentUser));
        ipcMain.handle('get-classes', async () => db.getClasses(this.currentUser));
        ipcMain.handle('save-class', async (event, data) => db.saveClass(data, this.currentUser));
        ipcMain.handle('book-class', async (event, data) => db.bookClass(data.classId, data.memberId, this.currentUser));
        ipcMain.handle('get-reports', async (event, range) => db.getReports(this.currentUser, range));

        // معالجة التنقل
        ipcMain.on('navigate-to-dashboard', () => {
            if (this.mainWindow) {
                this.mainWindow.loadFile(path.join(__dirname, 'frontend', 'professional_dashboard.html'));
            }
        });

        ipcMain.on('open-external', (event, url) => {
            // Only allow http and https protocols
            if (url && (url.startsWith('http:') || url.startsWith('https:'))) {
                shell.openExternal(url);
            }
        });
    }

    async exportData() {
        try {
            const result = await dialog.showSaveDialog(this.mainWindow, {
                title: 'تصدير البيانات',
                defaultPath: `gym_data_export_${new Date().toISOString().split('T')[0]}.json`,
                filters: [
                    { name: 'ملفات JSON', extensions: ['json'] }
                ]
            });

            if (!result.canceled) {
                const data = await db.exportAllData();
                fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));

                dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'تصدير البيانات',
                    message: 'تم تصدير البيانات بنجاح',
                    buttons: ['موافق']
                });
            }
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showErrorDialog('خطأ في التصدير', 'فشل في تصدير البيانات');
        }
    }

    async importData() {
        try {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                title: 'استيراد البيانات',
                filters: [
                    { name: 'ملفات JSON', extensions: ['json'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
                await db.importAllData(data);

                dialog.showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'استيراد البيانات',
                    message: 'تم استيراد البيانات بنجاح',
                    buttons: ['موافق']
                });

                if (this.mainWindow) {
                    this.mainWindow.reload();
                }
            }
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            this.showErrorDialog('خطأ في الاستيراد', 'فشل في استيراد البيانات');
        }
    }

    showAboutDialog() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'حول التطبيق',
            message: 'نظام إدارة الجيم المتطور',
            detail: `الإصدار: 2.0.0
نظام شامل لإدارة الأندية الرياضية والجيمات`,
            buttons: ['موافق']
        });
    }

    showErrorDialog(title, message) {
        dialog.showErrorBox(title, message);
    }
}

// إنشاء مثيل من التطبيق
const gymApp = new GymManagementApp();