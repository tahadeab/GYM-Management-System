const { ipcRenderer } = require('electron');
const db = require('../database/db');
const Helpers = require('../scripts/helpers');

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadDashboardStats();
        this.setupNavigation();
    }

    checkAuthentication() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            this.updateUserInfo();
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }

    updateUserInfo() {
        const userElement = document.getElementById('currentUser');
        const roleElement = document.querySelector('.user-role');
        
        if (userElement) {
            userElement.textContent = this.currentUser.username;
        }
        
        if (roleElement) {
            const roleMap = {
                'admin': 'مدير النظام',
                'manager': 'مدير',
                'staff': 'موظف',
                'trainer': 'مدرب'
            };
            roleElement.textContent = roleMap[this.currentUser.role] || 'مستخدم';
        }
    }

    setupEventListeners() {
        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // التنقل بين الصفحات
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
    }

    setupNavigation() {
        // إضافة مستمع للتنقل بالكيبورد
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToPage('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToPage('members');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToPage('trainers');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToPage('subscriptions');
                        break;
                }
            }
        });
    }

    navigateToPage(page) {
        // إخفاء جميع المحتويات
        const allContents = document.querySelectorAll('.page-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });

        // إزالة الفئة النشطة من جميع الروابط
        const allLinks = document.querySelectorAll('.sidebar-nav li');
        allLinks.forEach(link => {
            link.classList.remove('active');
        });

        // إظهار المحتوى المطلوب
        const targetContent = document.getElementById(page + 'Content');
        if (targetContent) {
            targetContent.style.display = 'block';
        }

        // إضافة الفئة النشطة للرابط المحدد
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }

        // تحديث عنوان الصفحة
        const pageTitle = document.getElementById('pageTitle');
        const pageTitles = {
            'dashboard': 'لوحة التحكم',
            'members': 'إدارة الأعضاء',
            'trainers': 'إدارة المدربين',
            'subscriptions': 'إدارة الاشتراكات',
            'attendance': 'تتبع الحضور',
            'payments': 'إدارة المدفوعات',
            'classes': 'إدارة الحصص',
            'reports': 'التقارير',
            'settings': 'الإعدادات'
        };
        
        if (pageTitle && pageTitles[page]) {
            pageTitle.textContent = pageTitles[page];
        }

        this.currentPage = page;
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        switch(page) {
            case 'dashboard':
                await this.loadDashboardStats();
                break;
            case 'members':
                await this.loadMembersPage();
                break;
            case 'trainers':
                await this.loadTrainersPage();
                break;
            case 'subscriptions':
                await this.loadSubscriptionsPage();
                break;
            case 'attendance':
                await this.loadAttendancePage();
                break;
            case 'payments':
                await this.loadPaymentsPage();
                break;
            case 'classes':
                await this.loadClassesPage();
                break;
            case 'reports':
                await this.loadReportsPage();
                break;
            case 'settings':
                await this.loadSettingsPage();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            const stats = await db.getDashboardStats();
            
            // تحديث الإحصائيات
            document.getElementById('activeMembers').textContent = stats.active_members || 0;
            document.getElementById('activeTrainers').textContent = stats.active_trainers || 0;
            document.getElementById('todayAttendance').textContent = stats.today_attendance || 0;
            document.getElementById('todayPayments').textContent = stats.today_payments || 0;

            // تحميل الأعضاء الجدد
            await this.loadNewMembers();
            
            // تحميل الاشتراكات المنتهية قريباً
            await this.loadExpiringSubscriptions();
            
        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        }
    }

    async loadNewMembers() {
        try {
            const members = await db.getAllMembers();
            const newMembers = members.slice(0, 5); // آخر 5 أعضاء
            
            const container = document.getElementById('newMembers');
            if (container) {
                container.innerHTML = newMembers.length > 0 
                    ? this.renderMembersList(newMembers)
                    : '<p class="no-data">لا توجد أعضاء جدد</p>';
            }
        } catch (error) {
            console.error('خطأ في تحميل الأعضاء الجدد:', error);
        }
    }

    async loadExpiringSubscriptions() {
        try {
            // هنا يمكن إضافة منطق لتحميل الاشتراكات المنتهية قريباً
            const container = document.getElementById('expiringSubscriptions');
            if (container) {
                container.innerHTML = '<p class="no-data">لا توجد اشتراكات منتهية قريباً</p>';
            }
        } catch (error) {
            console.error('خطأ في تحميل الاشتراكات المنتهية:', error);
        }
    }

    renderMembersList(members) {
        return `
            <div class="members-list">
                ${members.map(member => `
                    <div class="member-item">
                        <div class="member-info">
                            <strong>${member.name}</strong>
                            <span class="member-phone">${member.phone || 'لا يوجد رقم'}</span>
                        </div>
                        <div class="member-status ${member.status}">
                            ${Helpers.formatMemberStatus(member.status)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadMembersPage() {
        const container = document.getElementById('membersContent');
        if (container) {
            container.innerHTML = `
                <div class="page-header">
                    <h2>إدارة الأعضاء</h2>
                    <button class="btn btn-primary" onclick="dashboardManager.showAddMemberModal()">
                        إضافة عضو جديد
                    </button>
                </div>
                <div class="table-container">
                    <div class="table-header">
                        <h3>قائمة الأعضاء</h3>
                        <input type="text" placeholder="البحث في الأعضاء..." class="search-input">
                    </div>
                    <div id="membersTable">
                        <p>جاري التحميل...</p>
                    </div>
                </div>
            `;
            
            await this.loadMembersTable();
        }
    }

    async loadMembersTable() {
        try {
            const members = await db.getAllMembers();
            const table = document.getElementById('membersTable');
            
            if (table) {
                table.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>رقم الهاتف</th>
                                <th>البريد الإلكتروني</th>
                                <th>نوع الاشتراك</th>
                                <th>الحالة</th>
                                <th>تاريخ الانضمام</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${members.map(member => `
                                <tr>
                                    <td>${member.name}</td>
                                    <td>${member.phone || '-'}</td>
                                    <td>${member.email || '-'}</td>
                                    <td>${Helpers.formatMembershipType(member.membership_type)}</td>
                                    <td>
                                        <span class="status-badge ${member.status}">
                                            ${Helpers.formatMemberStatus(member.status)}
                                        </span>
                                    </td>
                                    <td>${Helpers.formatDate(member.join_date)}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="dashboardManager.editMember(${member.id})">
                                            تعديل
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="dashboardManager.deleteMember(${member.id})">
                                            حذف
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        } catch (error) {
            console.error('خطأ في تحميل جدول الأعضاء:', error);
        }
    }

    // دوال إضافية للصفحات الأخرى
    async loadTrainersPage() {
        const container = document.getElementById('trainersContent');
        if (container) {
            container.innerHTML = '<h2>صفحة المدربين - قيد التطوير</h2>';
        }
    }

    async loadSubscriptionsPage() {
        const container = document.getElementById('subscriptionsContent');
        if (container) {
            container.innerHTML = '<h2>صفحة الاشتراكات - قيد التطوير</h2>';
        }
    }

    async loadAttendancePage() {
        const container = document.getElementById('attendanceContent');
        if (container) {
            container.innerHTML = '<h2>صفحة الحضور - قيد التطوير</h2>';
        }
    }

    async loadPaymentsPage() {
        const container = document.getElementById('paymentsContent');
        if (container) {
            container.innerHTML = '<h2>صفحة المدفوعات - قيد التطوير</h2>';
        }
    }

    async loadClassesPage() {
        const container = document.getElementById('classesContent');
        if (container) {
            container.innerHTML = '<h2>صفحة الحصص - قيد التطوير</h2>';
        }
    }

    async loadReportsPage() {
        const container = document.getElementById('reportsContent');
        if (container) {
            container.innerHTML = '<h2>صفحة التقارير - قيد التطوير</h2>';
        }
    }

    async loadSettingsPage() {
        const container = document.getElementById('settingsContent');
        if (container) {
            container.innerHTML = '<h2>صفحة الإعدادات - قيد التطوير</h2>';
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// تهيئة مدير لوحة التحكم
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});

// إضافة CSS إضافي للعناصر الجديدة
const additionalCSS = `
    .members-list {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .member-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .member-info {
        display: flex;
        flex-direction: column;
    }
    
    .member-phone {
        font-size: 12px;
        color: #7f8c8d;
    }
    
    .member-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .member-status.active {
        background: #d4edda;
        color: #155724;
    }
    
    .member-status.inactive {
        background: #f8d7da;
        color: #721c24;
    }
    
    .no-data {
        text-align: center;
        color: #7f8c8d;
        font-style: italic;
        padding: 20px;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
    }
    
    .btn-sm {
        padding: 5px 10px;
        font-size: 12px;
        margin: 0 2px;
    }
    
    .search-input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 200px;
    }
`;

// إضافة CSS للصفحة
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style); 