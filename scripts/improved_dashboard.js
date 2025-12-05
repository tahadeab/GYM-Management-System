const { ipcRenderer } = require('electron');
const db = require('../database/improved_db');
const Helpers = require('../scripts/helpers');

class ImprovedDashboardManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.initializeElements();
        this.setupEventListeners();
        this.loadDashboardData();
        this.initializeCharts();
        this.startAutoRefresh();
        this.updateCurrentTime();
        this.addAnimations();
    }

    checkAuthentication() {
        const userSession = localStorage.getItem('userSession');
        if (!userSession) {
            window.location.href = 'improved_login.html';
            return;
        }

        try {
            const session = JSON.parse(userSession);
            const now = new Date().getTime();
            const sessionTimeout = 30 * 60 * 1000; // 30 دقيقة

            if (now - session.loginTime > sessionTimeout) {
                localStorage.removeItem('userSession');
                this.showNotification('انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.', 'warning');
                setTimeout(() => {
                    window.location.href = 'improved_login.html';
                }, 2000);
                return;
            }

            // تحديث معلومات المستخدم
            document.getElementById('currentUser').textContent = session.full_name || session.username;
        } catch (error) {
            console.error('خطأ في التحقق من الجلسة:', error);
            window.location.href = 'improved_login.html';
        }
    }

    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.currentTimeElement = document.getElementById('currentTime');
        this.currentPageBreadcrumb = document.getElementById('currentPageBreadcrumb');
        
        // عناصر الإحصائيات
        this.activeMembersElement = document.getElementById('activeMembers');
        this.activeTrainersElement = document.getElementById('activeTrainers');
        this.todayAttendanceElement = document.getElementById('todayAttendance');
        this.todayRevenueElement = document.getElementById('todayRevenue');
        
        // عناصر النشاطات
        this.recentActivitiesElement = document.getElementById('recentActivities');
    }

    setupEventListeners() {
        // تبديل الشريط الجانبي
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // تسجيل الخروج
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // التنقل بين الصفحات
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // الإجراءات السريعة
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // إغلاق التنبيهات
        document.querySelectorAll('.alert-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeAlert(e));
        });

        // أزرار الرسوم البيانية
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleChartAction(e));
        });

        // ملء الشاشة
        const fullscreenBtn = document.querySelector('.fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // البحث
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.openSearch());
        }

        // الإشعارات
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.showNotifications());
        }

        // إغلاق الشريط الجانبي عند النقر خارجه (موبايل)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.sidebar.classList.contains('open')) {
                if (!this.sidebar.contains(e.target) && !this.mobileMenuBtn.contains(e.target)) {
                    this.sidebar.classList.remove('open');
                }
            }
        });

        // تحديث الوقت كل ثانية
        setInterval(() => this.updateCurrentTime(), 1000);

        // إعادة تحميل البيانات عند التركيز على النافذة
        window.addEventListener('focus', () => {
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
    }

    toggleMobileSidebar() {
        this.sidebar.classList.toggle('open');
    }

    async handleLogout() {
        try {
            // إظهار تأكيد
            if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                return;
            }

            // إظهار حالة التحميل
            this.showLoading();

            // تسجيل عملية الخروج
            const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
            this.logActivity('logout', userSession.username);

            // مسح البيانات المحلية
            localStorage.removeItem('userSession');
            localStorage.removeItem('dashboardData');

            // إيقاف التحديث التلقائي
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }

            this.showNotification('تم تسجيل الخروج بنجاح', 'success');

            // الانتقال إلى صفحة تسجيل الدخول
            setTimeout(() => {
                window.location.href = 'improved_login.html';
            }, 1500);

        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            this.showNotification('حدث خطأ أثناء تسجيل الخروج', 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const page = link.dataset.page;

        if (page === this.currentPage) return;

        // إزالة الحالة النشطة من العنصر الحالي
        document.querySelector('.nav-item.active')?.classList.remove('active');
        
        // إضافة الحالة النشطة للعنصر الجديد
        link.closest('.nav-item').classList.add('active');

        // إخفاء المحتوى الحالي
        document.getElementById(`${this.currentPage}Content`)?.style.setProperty('display', 'none');

        // إظهار المحتوى الجديد
        const newContent = document.getElementById(`${page}Content`);
        if (newContent) {
            newContent.style.display = 'block';
            this.animatePageTransition(newContent);
        }

        // تحديث الصفحة الحالية
        this.currentPage = page;
        this.updateBreadcrumb(page);

        // تحميل بيانات الصفحة الجديدة
        this.loadPageData(page);

        // إغلاق الشريط الجانبي في الموبايل
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
        }
    }

    updateBreadcrumb(page) {
        const pageNames = {
            dashboard: 'لوحة التحكم',
            members: 'الأعضاء',
            trainers: 'المدربين',
            subscriptions: 'الاشتراكات',
            attendance: 'الحضور',
            payments: 'المدفوعات',
            classes: 'الحصص',
            equipment: 'المعدات',
            reports: 'التقارير',
            settings: 'الإعدادات'
        };

        this.currentPageBreadcrumb.textContent = pageNames[page] || page;
    }

    async loadDashboardData() {
        try {
            this.showLoading();

            // تحميل الإحصائيات
            const stats = await db.getDashboardStats();
            this.updateStats(stats);

            // تحميل النشاطات الأخيرة
            const activities = await this.getRecentActivities();
            this.updateRecentActivities(activities);

            // تحديث الرسوم البيانية
            this.updateCharts();

            // حفظ البيانات في التخزين المحلي
            localStorage.setItem('dashboardData', JSON.stringify({
                stats,
                activities,
                timestamp: new Date().getTime()
            }));

        } catch (error) {
            console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
            
            // محاولة تحميل البيانات المحفوظة
            this.loadCachedData();
        } finally {
            this.hideLoading();
        }
    }

    loadCachedData() {
        try {
            const cachedData = localStorage.getItem('dashboardData');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                const now = new Date().getTime();
                
                // استخدام البيانات المحفوظة إذا كانت أحدث من 5 دقائق
                if (now - data.timestamp < 5 * 60 * 1000) {
                    this.updateStats(data.stats);
                    this.updateRecentActivities(data.activities);
                    this.showNotification('تم تحميل البيانات المحفوظة', 'info');
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات المحفوظة:', error);
        }
    }

    updateStats(stats) {
        if (!stats) return;

        // تحديث الأرقام مع تأثير العد
        this.animateNumber(this.activeMembersElement, stats.active_members || 0);
        this.animateNumber(this.activeTrainersElement, stats.active_trainers || 0);
        this.animateNumber(this.todayAttendanceElement, stats.today_attendance || 0);
        this.animateNumber(this.todayRevenueElement, stats.today_revenue || 0);

        // تحديث أشرطة التقدم
        this.updateProgressBars(stats);
    }

    animateNumber(element, targetValue) {
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString('ar-SA');

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateProgressBars(stats) {
        // حساب النسب المئوية وتحديث أشرطة التقدم
        const totalCapacity = 200; // السعة الإجمالية للجيم
        const memberProgress = Math.min((stats.active_members / totalCapacity) * 100, 100);
        
        document.querySelector('.stat-card.primary .progress-bar').style.width = `${memberProgress}%`;
    }

    async getRecentActivities() {
        // محاكاة البيانات - يجب استبدالها بالبيانات الحقيقية من قاعدة البيانات
        return [
            {
                type: 'member_added',
                icon: 'fas fa-user-plus',
                iconClass: 'success',
                text: 'تم إضافة عضو جديد: أحمد محمد',
                time: 'منذ 5 دقائق'
            },
            {
                type: 'payment_received',
                icon: 'fas fa-credit-card',
                iconClass: 'primary',
                text: 'تم تسجيل دفعة بقيمة 500 ريال',
                time: 'منذ 15 دقيقة'
            },
            {
                type: 'subscription_expiring',
                icon: 'fas fa-exclamation-triangle',
                iconClass: 'warning',
                text: 'اشتراك سارة أحمد ينتهي خلال 3 أيام',
                time: 'منذ 30 دقيقة'
            },
            {
                type: 'equipment_maintenance',
                icon: 'fas fa-tools',
                iconClass: 'info',
                text: 'تم صيانة جهاز الجري رقم 3',
                time: 'منذ ساعة'
            }
        ];
    }

    updateRecentActivities(activities) {
        if (!this.recentActivitiesElement || !activities) return;

        this.recentActivitiesElement.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.iconClass}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.initAttendanceChart();
        this.initSubscriptionChart();
    }

    initAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                datasets: [{
                    label: 'الحضور',
                    data: [65, 78, 90, 81, 56, 85, 40],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    initSubscriptionChart() {
        const ctx = document.getElementById('subscriptionChart');
        if (!ctx) return;

        this.charts.subscription = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['شهري', 'ربع سنوي', 'سنوي', 'يومي'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        'rgb(102, 126, 234)',
                        'rgb(118, 75, 162)',
                        'rgb(39, 174, 96)',
                        'rgb(243, 156, 18)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        // تحديث بيانات الرسوم البيانية
        if (this.charts.attendance) {
            // تحديث بيانات الحضور
            this.charts.attendance.data.datasets[0].data = [65, 78, 90, 81, 56, 85, 40];
            this.charts.attendance.update();
        }

        if (this.charts.subscription) {
            // تحديث بيانات الاشتراكات
            this.charts.subscription.data.datasets[0].data = [45, 25, 20, 10];
            this.charts.subscription.update();
        }
    }

    handleQuickAction(e) {
        const btn = e.currentTarget;
        const action = btn.textContent.trim();

        switch (action) {
            case 'إضافة عضو جديد':
                this.navigateToPage('members');
                break;
            case 'تسجيل دفعة':
                this.navigateToPage('payments');
                break;
            case 'تسجيل حضور':
                this.navigateToPage('attendance');
                break;
            case 'إضافة حصة':
                this.navigateToPage('classes');
                break;
            default:
                this.showNotification('هذه الميزة قيد التطوير', 'info');
        }
    }

    navigateToPage(page) {
        const navLink = document.querySelector(`[data-page=\"${page}\"]`);
        if (navLink) {
            navLink.click();
        }
    }

    closeAlert(e) {
        const alert = e.target.closest('.alert');
        if (alert) {
            alert.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }
    }

    handleChartAction(e) {
        const btn = e.currentTarget;
        const icon = btn.querySelector('i');
        
        if (icon.classList.contains('fa-download')) {
            this.downloadChart(btn);
        } else if (icon.classList.contains('fa-expand')) {
            this.expandChart(btn);
        }
    }

    downloadChart(btn) {
        this.showNotification('جاري تحضير الملف للتحميل...', 'info');
        // تنفيذ تحميل الرسم البياني
    }

    expandChart(btn) {
        this.showNotification('عرض الرسم البياني في نافذة منفصلة', 'info');
        // تنفيذ توسيع الرسم البياني
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    openSearch() {
        this.showNotification('ميزة البحث قيد التطوير', 'info');
    }

    showNotifications() {
        this.showNotification('لديك 3 إشعارات جديدة', 'info');
    }

    updateCurrentTime() {
        if (!this.currentTimeElement) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        this.currentTimeElement.textContent = timeString;
    }

    startAutoRefresh() {
        // تحديث البيانات كل 5 دقائق
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadDashboardData();
            }
        }, 5 * 60 * 1000);
    }

    loadPageData(page) {
        // تحميل بيانات الصفحة المحددة
        switch (page) {
            case 'members':
                this.loadMembersData();
                break;
            case 'trainers':
                this.loadTrainersData();
                break;
            case 'subscriptions':
                this.loadSubscriptionsData();
                break;
            // إضافة باقي الصفحات...
        }
    }

    async loadMembersData() {
        try {
            const members = await db.getAllMembers();
            // تحديث واجهة الأعضاء
        } catch (error) {
            console.error('خطأ في تحميل بيانات الأعضاء:', error);
        }
    }

    async loadTrainersData() {
        try {
            const trainers = await db.getAllTrainers();
            // تحديث واجهة المدربين
        } catch (error) {
            console.error('خطأ في تحميل بيانات المدربين:', error);
        }
    }

    async loadSubscriptionsData() {
        try {
            // تحميل بيانات الاشتراكات
        } catch (error) {
            console.error('خطأ في تحميل بيانات الاشتراكات:', error);
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        if (!toast) return;

        const icon = toast.querySelector('.toast-icon');
        const messageElement = toast.querySelector('.toast-message');

        // تحديد الأيقونة حسب النوع
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        icon.className = `toast-icon ${icons[type]}`;
        icon.style.color = colors[type];
        messageElement.textContent = message;

        // إظهار التوست
        toast.classList.add('show');

        // إخفاء التوست بعد 5 ثواني
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);

        // إضافة مستمع لزر الإغلاق
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => toast.classList.remove('show');
    }

    animatePageTransition(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 50);
    }

    addAnimations() {
        // إضافة تأثيرات الحركة للعناصر
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeIn 0.6s ease forwards';
                }
            });
        }, observerOptions);

        // مراقبة العناصر القابلة للحركة
        document.querySelectorAll('.stat-card, .chart-card, .section-card').forEach(el => {
            observer.observe(el);
        });
    }

    logActivity(action, details) {
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        activities.push({
            action,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // الاحتفاظ بآخر 100 نشاط
        if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
        }

        localStorage.setItem('userActivities', JSON.stringify(activities));
    }

    // تنظيف الموارد عند إغلاق الصفحة
    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // تدمير الرسوم البيانية
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    }
}

// تهيئة مدير لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new ImprovedDashboardManager();
});

// تنظيف الموارد عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.cleanup();
    }
});

// إضافة دعم اختصارات لوحة المفاتيح
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + D للوحة التحكم
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        document.querySelector('[data-page=\"dashboard\"]')?.click();
    }
    
    // Ctrl/Cmd + M للأعضاء
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        document.querySelector('[data-page=\"members\"]')?.click();
    }
    
    // Ctrl/Cmd + T للمدربين
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        document.querySelector('[data-page=\"trainers\"]')?.click();
    }
    
    // Escape لإغلاق النوافذ المنبثقة
    if (e.key === 'Escape') {
        document.querySelector('.notification-toast.show')?.classList.remove('show');
        document.getElementById('loadingOverlay').style.display = 'none';
    }
});

