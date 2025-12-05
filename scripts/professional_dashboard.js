// نظام إدارة الجيم المتطور - سكريپت لوحة التحكم الاحترافية
class ProfessionalDashboard {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.activities = [];
        this.alerts = [];
        this.charts = {};
        this.isLoading = false;

        this.init();
    }

    async init() {
        try {
            await this.loadUserSession();
            this.setupEventListeners();
            this.initializeComponents();
            await this.loadDashboardData();
            this.startRealTimeUpdates();
        } catch (error) {
            console.error('خطأ في تهيئة لوحة التحكم:', error);
            this.showToast('حدث خطأ في تحميل لوحة التحكم', 'error');
        }
    }

    async loadUserSession() {
        try {
            const session = sessionStorage.getItem('userSession');
            if (session) {
                const sessionData = JSON.parse(session);

                // التحقق من انتهاء صلاحية الجلسة
                if (Date.now() > sessionData.expiresAt) {
                    this.redirectToLogin();
                    return;
                }

                this.currentUser = sessionData.user;
                this.updateUserInterface();
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('خطأ في تحميل جلسة المستخدم:', error);
            this.redirectToLogin();
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.fullName || this.currentUser.username;
            document.getElementById('userRole').textContent = this.getRoleDisplayName(this.currentUser.role);
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': 'مدير النظام',
            'manager': 'مدير النادي',
            'employee': 'موظف',
            'trainer': 'مدرب'
        };
        return roles[role] || 'مستخدم';
    }

    setupEventListeners() {
        // أحداث الشريط الجانبي
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // أحداث التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });

        // أحداث التنقل
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                navigateToPage(page);
            });
        });

        // أحداث الإشعارات
        document.getElementById('notificationBtn').addEventListener('click', () => {
            this.toggleNotifications();
        });

        // أحداث قائمة المستخدم
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            this.toggleUserMenu();
        });

        // تسجيل الخروج
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // البحث العام
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // أحداث الأزرار
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.refreshDashboardData();
        });

        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportDashboardReport();
        });

        // إغلاق القوائم المنسدلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // تحديث حجم النافذة
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    initializeComponents() {
        this.initializeCharts();
        this.setupNotificationSystem();
        this.setupActivityFeed();
        this.setupAlertSystem();
    }

    async loadDashboardData() {
        this.showLoading(true);

        try {
            // تحميل البيانات بشكل متوازي
            const [stats, activities, notifications, alerts] = await Promise.all([
                this.loadStatistics(),
                this.loadRecentActivities(),
                this.loadNotifications(),
                this.loadAlerts()
            ]);

            this.updateStatistics(stats);
            this.updateActivityFeed(activities);
            this.updateNotifications(notifications);
            this.updateAlerts(alerts);
            this.updateCharts();

        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
            this.showToast('فشل في تحميل بعض البيانات', 'warning');
        } finally {
            this.showLoading(false);
        }
    }

    async loadStatistics() {
        try {
            if (window.api) {
                const stats = await window.api.getDashboardStats();
                // Map DB snake_case to UI camelCase
                return {
                    totalMembers: stats.total_members || 0,
                    activeMembers: stats.active_members || 0,
                    todayRevenue: stats.today_revenue || 0,
                    todayAttendance: stats.today_attendance || 0,
                    // Growth stats - set to 0 or calculate if history available
                    monthlyGrowth: 0,
                    dailyGrowth: 0,
                    revenueGrowth: 0,
                    attendanceChange: 0
                };
            } else {
                // Fallback for development without Electron
                console.warn('API not available, using mock data');
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    totalMembers: 245,
                    activeMembers: 189,
                    todayRevenue: 2450,
                    todayAttendance: 67,
                    monthlyGrowth: 12,
                    dailyGrowth: 8,
                    revenueGrowth: 15,
                    attendanceChange: 0
                };
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            throw new Error('فشل في تحميل الإحصائيات');
        }
    }

    async loadRecentActivities() {
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            return [
                {
                    id: 1,
                    type: 'member_joined',
                    title: 'عضو جديد انضم للنادي',
                    description: 'أحمد محمد انضم إلى النادي',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000),
                    icon: 'fas fa-user-plus',
                    color: 'success'
                },
                {
                    id: 2,
                    type: 'payment_received',
                    title: 'تم استلام دفعة جديدة',
                    description: 'سارة أحمد دفعت اشتراك شهري - 150 ر.س',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000),
                    icon: 'fas fa-credit-card',
                    color: 'primary'
                },
                {
                    id: 3,
                    type: 'class_completed',
                    title: 'انتهت حصة تدريبية',
                    description: 'حصة اليوغا الصباحية - 12 مشارك',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    icon: 'fas fa-dumbbell',
                    color: 'info'
                }
            ];
        } catch (error) {
            throw new Error('فشل في تحميل الأنشطة الحديثة');
        }
    }

    async loadNotifications() {
        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            return [
                {
                    id: 1,
                    title: 'اشتراك على وشك الانتهاء',
                    message: 'اشتراك محمد علي ينتهي خلال 3 أيام',
                    type: 'warning',
                    timestamp: new Date(Date.now() - 10 * 60 * 1000),
                    read: false
                },
                {
                    id: 2,
                    title: 'معدات تحتاج صيانة',
                    message: 'جهاز الجري رقم 3 يحتاج فحص دوري',
                    type: 'info',
                    timestamp: new Date(Date.now() - 60 * 60 * 1000),
                    read: false
                },
                {
                    id: 3,
                    title: 'تقرير شهري جاهز',
                    message: 'تقرير شهر نوفمبر متاح للتحميل',
                    type: 'success',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    read: true
                }
            ];
        } catch (error) {
            throw new Error('فشل في تحميل الإشعارات');
        }
    }

    async loadAlerts() {
        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            return [
                {
                    id: 1,
                    title: 'اشتراكات منتهية الصلاحية',
                    count: 8,
                    type: 'error',
                    action: 'عرض القائمة'
                },
                {
                    id: 2,
                    title: 'معدات تحتاج صيانة',
                    count: 3,
                    type: 'warning',
                    action: 'جدولة الصيانة'
                },
                {
                    id: 3,
                    title: 'حجوزات في انتظار التأكيد',
                    count: 12,
                    type: 'info',
                    action: 'مراجعة الحجوزات'
                }
            ];
        } catch (error) {
            throw new Error('فشل في تحميل التنبيهات');
        }
    }

    updateStatistics(stats) {
        // تحديث الأرقام مع تأثير العد التصاعدي
        this.animateNumber('totalMembers', stats.totalMembers);
        this.animateNumber('activeMembers', stats.activeMembers);
        this.animateNumber('todayRevenue', stats.todayRevenue);
        this.animateNumber('todayAttendance', stats.todayAttendance);

        // تحديث مؤشرات التغيير
        this.updateChangeIndicator('totalMembers', stats.monthlyGrowth, 'هذا الشهر');
        this.updateChangeIndicator('activeMembers', stats.dailyGrowth, 'اليوم');
        this.updateChangeIndicator('todayRevenue', stats.revenueGrowth, '%');
        this.updateChangeIndicator('todayAttendance', stats.attendanceChange, 'نفس الأمس');
    }

    animateNumber(elementId, targetValue, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }

            element.textContent = Math.floor(currentValue).toLocaleString('ar-SA');
        }, 16);
    }

    updateChangeIndicator(statId, change, suffix) {
        const statCard = document.querySelector(`#${statId}`).closest('.stat-card');
        const changeElement = statCard.querySelector('.stat-change span');

        if (changeElement) {
            if (change > 0) {
                changeElement.textContent = `+${change} ${suffix}`;
                changeElement.parentElement.className = 'stat-change positive';
                changeElement.parentElement.querySelector('i').className = 'fas fa-arrow-up';
            } else if (change < 0) {
                changeElement.textContent = `${change} ${suffix}`;
                changeElement.parentElement.className = 'stat-change negative';
                changeElement.parentElement.querySelector('i').className = 'fas fa-arrow-down';
            } else {
                changeElement.textContent = suffix;
                changeElement.parentElement.className = 'stat-change neutral';
                changeElement.parentElement.querySelector('i').className = 'fas fa-minus';
            }
        }
    }

    initializeCharts() {
        this.initializeAttendanceChart();
        this.initializeRevenueChart();
    }

    initializeAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                datasets: [{
                    label: 'الحضور اليومي',
                    data: [65, 78, 90, 81, 56, 67, 89],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initializeRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر'],
                datasets: [{
                    label: 'الإيرادات الشهرية',
                    data: [45000, 52000, 48000, 61000, 55000, 67000],
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#f97316'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y.toLocaleString('ar-SA') + ' ر.س';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280',
                            callback: function (value) {
                                return (value / 1000) + 'ك ر.س';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        // تحديث بيانات الرسوم البيانية
        if (this.charts.attendance) {
            this.charts.attendance.update('active');
        }

        if (this.charts.revenue) {
            this.charts.revenue.update('active');
        }
    }

    setupNotificationSystem() {
        // إعداد نظام الإشعارات
        this.notifications = [];
    }

    updateNotifications(notifications) {
        this.notifications = notifications;
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        container.innerHTML = '';

        this.notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            container.appendChild(notificationElement);
        });
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? 'read' : 'unread'}`;

        const iconDiv = document.createElement('div');
        iconDiv.className = `notification-icon ${notification.type}`;
        const icon = document.createElement('i');
        icon.className = `fas ${this.getNotificationIcon(notification.type)}`;
        iconDiv.appendChild(icon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'notification-content';

        const title = document.createElement('h4');
        title.className = 'notification-title';
        title.textContent = notification.title;

        const message = document.createElement('p');
        message.className = 'notification-message';
        message.textContent = notification.message;

        const time = document.createElement('span');
        time.className = 'notification-time';
        time.textContent = this.formatTimeAgo(notification.timestamp);

        contentDiv.appendChild(title);
        contentDiv.appendChild(message);
        contentDiv.appendChild(time);

        const actionBtn = document.createElement('button');
        actionBtn.className = 'notification-action';
        actionBtn.onclick = () => dashboard.markAsRead(notification.id);
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        actionBtn.appendChild(checkIcon);

        div.appendChild(iconDiv);
        div.appendChild(contentDiv);
        div.appendChild(actionBtn);

        return div;
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-times-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        const unreadCount = this.notifications.filter(n => !n.read).length;

        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    setupActivityFeed() {
        this.activities = [];
    }

    updateActivityFeed(activities) {
        this.activities = activities;
        this.renderActivities();
    }

    renderActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        container.innerHTML = '';

        this.activities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            container.appendChild(activityElement);
        });
    }

    createActivityElement(activity) {
        const div = document.createElement('div');
        div.className = 'activity-item';

        const iconDiv = document.createElement('div');
        iconDiv.className = `activity-icon ${activity.color}`;
        const icon = document.createElement('i');
        icon.className = activity.icon;
        iconDiv.appendChild(icon);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'activity-content';

        const title = document.createElement('h4');
        title.className = 'activity-title';
        title.textContent = activity.title;

        const description = document.createElement('p');
        description.className = 'activity-description';
        description.textContent = activity.description;

        const time = document.createElement('span');
        time.className = 'activity-time';
        time.textContent = this.formatTimeAgo(activity.timestamp);

        contentDiv.appendChild(title);
        contentDiv.appendChild(description);
        contentDiv.appendChild(time);

        div.appendChild(iconDiv);
        div.appendChild(contentDiv);

        return div;
    }

    setupAlertSystem() {
        this.alerts = [];
    }

    updateAlerts(alerts) {
        this.alerts = alerts;
        this.renderAlerts();
        this.updateAlertsCount();
    }

    renderAlerts() {
        const container = document.getElementById('importantAlerts');
        if (!container) return;

        container.innerHTML = '';

        this.alerts.forEach(alert => {
            const alertElement = this.createAlertElement(alert);
            container.appendChild(alertElement);
        });
    }

    createAlertElement(alert) {
        const div = document.createElement('div');
        div.className = `alert-item ${alert.type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'alert-content';

        const title = document.createElement('h4');
        title.className = 'alert-title';
        title.textContent = alert.title;

        const count = document.createElement('span');
        count.className = 'alert-count';
        count.textContent = alert.count;

        contentDiv.appendChild(title);
        contentDiv.appendChild(count);

        const actionBtn = document.createElement('button');
        actionBtn.className = 'alert-action';
        actionBtn.textContent = alert.action;
        actionBtn.onclick = () => dashboard.handleAlert(alert.id);

        div.appendChild(contentDiv);
        div.appendChild(actionBtn);

        return div;
    }

    updateAlertsCount() {
        const countElement = document.getElementById('alertsCount');
        if (countElement) {
            countElement.textContent = this.alerts.length;
        }
    }

    // وظائف التفاعل
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');

        // حفظ حالة الشريط الجانبي
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.toggle('show');
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    }

    navigateToPage(page) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page-content').forEach(p => {
            p.classList.remove('active');
        });

        // إظهار الصفحة المطلوبة
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // تحديث التنقل النشط
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-page="${page}"]`).closest('.nav-item');
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // تحديث عنوان الصفحة
        this.updatePageTitle(page);
    }

    updatePageTitle(page) {
        const titles = {
            'dashboard': 'لوحة التحكم الرئيسية',
            'members': 'إدارة الأعضاء',
            'trainers': 'إدارة المدربين',
            'classes': 'الحصص والبرامج',
            'equipment': 'إدارة المعدات',
            'payments': 'المدفوعات والاشتراكات',
            'reports': 'التقارير والإحصائيات',
            'settings': 'إعدادات النظام'
        };

        document.title = `${titles[page] || 'نظام إدارة الجيم'} - نظام إدارة الجيم المتطور`;
    }

    handleGlobalSearch(query) {
        if (query.length < 2) return;

        // تنفيذ البحث العام
        console.log('البحث عن:', query);
        // يمكن إضافة منطق البحث هنا
    }

    async refreshDashboardData() {
        this.showToast('جاري تحديث البيانات...', 'info');
        await this.loadDashboardData();
        this.showToast('تم تحديث البيانات بنجاح', 'success');
    }

    exportDashboardReport() {
        this.showToast('جاري تصدير التقرير...', 'info');

        // محاكاة تصدير التقرير
        setTimeout(() => {
            this.showToast('تم تصدير التقرير بنجاح', 'success');
        }, 2000);
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.renderNotifications();
            this.updateNotificationBadge();
        }
    }

    handleAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            this.showToast(`تم التعامل مع: ${alert.title}`, 'success');
            // يمكن إضافة منطق التعامل مع التنبيه هنا
        }
    }

    handleOutsideClick(e) {
        // إغلاق القوائم المنسدلة عند النقر خارجها
        if (!e.target.closest('.notification-center')) {
            document.getElementById('notificationDropdown').classList.remove('show');
        }

        if (!e.target.closest('.user-menu')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
    }

    handleKeyboardShortcuts(e) {
        // اختصارات لوحة المفاتيح
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    this.refreshDashboardData();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportDashboardReport();
                    break;
                case 'k':
                    e.preventDefault();
                    document.getElementById('globalSearch').focus();
                    break;
            }
        }

        if (e.key === 'Escape') {
            // إغلاق جميع القوائم المنسدلة
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }

    handleWindowResize() {
        // تحديث الرسوم البيانية عند تغيير حجم النافذة
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    startRealTimeUpdates() {
        // تحديث البيانات كل 5 دقائق
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);

        // تحديث الوقت كل دقيقة
        setInterval(() => {
            this.updateTimeDisplays();
        }, 60 * 1000);
    }

    updateTimeDisplays() {
        // تحديث عرض الأوقات في الأنشطة والإشعارات
        document.querySelectorAll('.activity-time, .notification-time').forEach(element => {
            const timestamp = element.dataset.timestamp;
            if (timestamp) {
                element.textContent = this.formatTimeAgo(new Date(parseInt(timestamp)));
            }
        });
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'الآن';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `منذ ${minutes} دقيقة`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `منذ ${hours} ساعة`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `منذ ${days} يوم`;
        }
    }

    showLoading(show) {
        const loadingBar = document.getElementById('loadingBar');
        if (show) {
            loadingBar.classList.add('show');
            loadingBar.querySelector('.loading-progress').style.width = '100%';
        } else {
            setTimeout(() => {
                loadingBar.classList.remove('show');
                loadingBar.querySelector('.loading-progress').style.width = '0%';
            }, 500);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // إزالة التنبيه بعد 4 ثوانٍ
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease-in-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    logout() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            sessionStorage.removeItem('userSession');
            localStorage.removeItem('savedCredentials');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = 'professional_login.html';
    }
}

// إضافة أنماط CSS للمكونات الديناميكية
const dynamicStyles = `
    .notification-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        border-bottom: 1px solid var(--gray-200);
        transition: background var(--transition-fast);
    }
    
    .notification-item:hover {
        background: var(--gray-50);
    }
    
    .notification-item.unread {
        background: rgba(37, 99, 235, 0.05);
    }
    
    .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--white);
        font-size: var(--font-size-sm);
    }
    
    .notification-icon.success { background: var(--success-color); }
    .notification-icon.warning { background: var(--warning-color); }
    .notification-icon.error { background: var(--error-color); }
    .notification-icon.info { background: var(--info-color); }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: var(--spacing-1);
    }
    
    .notification-message {
        font-size: var(--font-size-xs);
        color: var(--gray-600);
        margin-bottom: var(--spacing-1);
    }
    
    .notification-time {
        font-size: var(--font-size-xs);
        color: var(--gray-400);
    }
    
    .notification-action {
        background: none;
        border: none;
        color: var(--gray-400);
        cursor: pointer;
        padding: var(--spacing-2);
        border-radius: var(--border-radius-sm);
        transition: all var(--transition-fast);
    }
    
    .notification-action:hover {
        background: var(--gray-100);
        color: var(--primary-color);
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--gray-200);
        transition: background var(--transition-fast);
    }
    
    .activity-item:hover {
        background: var(--gray-50);
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--white);
        font-size: var(--font-size-sm);
    }
    
    .activity-icon.success { background: var(--success-color); }
    .activity-icon.primary { background: var(--primary-color); }
    .activity-icon.info { background: var(--info-color); }
    .activity-icon.warning { background: var(--warning-color); }
    
    .activity-content {
        flex: 1;
    }
    
    .activity-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: var(--spacing-1);
    }
    
    .activity-description {
        font-size: var(--font-size-xs);
        color: var(--gray-600);
        margin-bottom: var(--spacing-1);
    }
    
    .activity-time {
        font-size: var(--font-size-xs);
        color: var(--gray-400);
    }
    
    .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--gray-200);
        transition: background var(--transition-fast);
    }
    
    .alert-item:hover {
        background: var(--gray-50);
    }
    
    .alert-content {
        flex: 1;
    }
    
    .alert-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--gray-900);
        margin-bottom: var(--spacing-1);
    }
    
    .alert-count {
        font-size: var(--font-size-xs);
        color: var(--gray-600);
    }
    
    .alert-action {
        background: var(--primary-color);
        color: var(--white);
        border: none;
        padding: var(--spacing-2) var(--spacing-3);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-xs);
        cursor: pointer;
        transition: background var(--transition-fast);
    }
    
    .alert-action:hover {
        background: var(--primary-dark);
    }
`;

// إضافة الأنماط إلى الصفحة
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// تهيئة لوحة التحكم عند تحميل الصفحة
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ProfessionalDashboard();
});

// دالة التنقل بين الصفحات
function navigateToPage(pageId) {
    // إخفاء جميع صفحات المحتوى
    document.querySelectorAll(".page-content").forEach(page => {
        page.classList.remove("active");
    });

    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add("active");
    } else {
        console.warn(`الصفحة ${pageId}-page غير موجودة.`);
        // إظهار لوحة التحكم الافتراضية
        document.getElementById("dashboard-page").classList.add("active");
    }

    // تحديث حالة النشاط في الشريط الجانبي
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });
    const activeNavItem = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeNavItem) {
        activeNavItem.closest(".nav-item").classList.add("active");
    }
}

// تصدير الكلاس للاستخدام الخارجي
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfessionalDashboard;
}

