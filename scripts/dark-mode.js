// Dark Mode Controller - تحكم في الوضع الداكن
class DarkModeController {
    constructor() {
        this.isDarkMode = false;
        this.init();
    }

    init() {
        // تحميل الإعداد المحفوظ
        this.loadSavedMode();
        
        // إنشاء زر التبديل
        this.createToggleButton();
        
        // تطبيق الوضع المحفوظ
        this.applyMode();
        
        // إضافة مستمعي الأحداث
        this.setupEventListeners();
    }

    loadSavedMode() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
            this.isDarkMode = JSON.parse(savedMode);
        } else {
            // التحقق من تفضيل النظام
            this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    createToggleButton() {
        // البحث عن مكان إدراج الزر في شريط التنقل
        const navbarActions = document.querySelector('.navbar-actions');
        if (!navbarActions) return;

        // إنشاء حاوية زر التبديل
        const darkModeToggle = document.createElement('div');
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = `
            <button class="dark-mode-btn" id="darkModeBtn" title="تبديل الوضع الداكن">
                <i class="fas fa-moon" id="darkModeIcon"></i>
            </button>
        `;

        // إدراج الزر قبل قائمة المستخدم
        const userMenu = navbarActions.querySelector('.user-menu');
        if (userMenu) {
            navbarActions.insertBefore(darkModeToggle, userMenu);
        } else {
            navbarActions.appendChild(darkModeToggle);
        }

        // إضافة الأنماط للزر
        this.addToggleButtonStyles();
    }

    addToggleButtonStyles() {
        const styles = `
            .dark-mode-toggle {
                margin-left: 1rem;
            }

            .dark-mode-btn {
                background: none;
                border: 2px solid var(--gray-300);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                color: var(--gray-600);
            }

            .dark-mode-btn:hover {
                border-color: var(--primary-color);
                color: var(--primary-color);
                transform: scale(1.1);
            }

            .dark-mode-btn i {
                font-size: 16px;
                transition: all 0.3s ease;
            }

            /* أنماط الوضع الداكن للزر */
            body.dark-mode .dark-mode-btn {
                border-color: var(--gray-400);
                color: var(--gray-300);
            }

            body.dark-mode .dark-mode-btn:hover {
                border-color: var(--primary-light);
                color: var(--primary-light);
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
            }

            /* تأثير الدوران عند التبديل */
            .dark-mode-btn.switching i {
                transform: rotate(360deg);
            }

            /* تأثير النبض للوضع النشط */
            body.dark-mode .dark-mode-btn {
                animation: darkModePulse 2s ease-in-out infinite;
            }

            @keyframes darkModePulse {
                0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
            }

            /* تحسينات للشاشات الصغيرة */
            @media (max-width: 768px) {
                .dark-mode-toggle {
                    margin-left: 0.5rem;
                }
                
                .dark-mode-btn {
                    width: 36px;
                    height: 36px;
                }
                
                .dark-mode-btn i {
                    font-size: 14px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // زر التبديل
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', () => {
                this.toggle();
            });
        }

        // اختصار لوحة المفاتيح (Ctrl/Cmd + Shift + D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });

        // مراقبة تغيير تفضيل النظام
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                // تطبيق تفضيل النظام فقط إذا لم يكن هناك إعداد محفوظ
                const savedMode = localStorage.getItem('darkMode');
                if (savedMode === null) {
                    this.isDarkMode = e.matches;
                    this.applyMode();
                }
            });
        }
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyMode();
        this.saveMode();
        this.showToggleAnimation();
        this.showToast();
    }

    applyMode() {
        const body = document.body;
        const darkModeIcon = document.getElementById('darkModeIcon');

        if (this.isDarkMode) {
            body.classList.add('dark-mode');
            if (darkModeIcon) {
                darkModeIcon.className = 'fas fa-sun';
            }
        } else {
            body.classList.remove('dark-mode');
            if (darkModeIcon) {
                darkModeIcon.className = 'fas fa-moon';
            }
        }

        // تحديث الرسوم البيانية إذا كانت موجودة
        this.updateCharts();
    }

    saveMode() {
        localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    }

    showToggleAnimation() {
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.classList.add('switching');
            setTimeout(() => {
                darkModeBtn.classList.remove('switching');
            }, 300);
        }
    }

    showToast() {
        const message = this.isDarkMode ? 'تم تفعيل الوضع الداكن' : 'تم تفعيل الوضع الفاتح';
        const type = 'info';

        // إنشاء عنصر التوست
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.isDarkMode ? 'moon' : 'sun'}"></i>
                <span>${message}</span>
            </div>
        `;

        // إضافة التوست إلى الصفحة
        document.body.appendChild(toast);

        // إظهار التوست
        setTimeout(() => toast.classList.add('show'), 100);

        // إخفاء التوست بعد 2 ثانية
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    updateCharts() {
        // تحديث ألوان الرسوم البيانية حسب الوضع
        if (window.dashboard && window.dashboard.charts) {
            const textColor = this.isDarkMode ? '#f3f4f6' : '#374151';
            const gridColor = this.isDarkMode ? '#4b5563' : '#e5e7eb';

            Object.values(window.dashboard.charts).forEach(chart => {
                if (chart && chart.options) {
                    // تحديث ألوان النص
                    if (chart.options.scales) {
                        if (chart.options.scales.x && chart.options.scales.x.ticks) {
                            chart.options.scales.x.ticks.color = textColor;
                        }
                        if (chart.options.scales.y && chart.options.scales.y.ticks) {
                            chart.options.scales.y.ticks.color = textColor;
                        }
                        
                        // تحديث ألوان الشبكة
                        if (chart.options.scales.x && chart.options.scales.x.grid) {
                            chart.options.scales.x.grid.color = gridColor;
                        }
                        if (chart.options.scales.y && chart.options.scales.y.grid) {
                            chart.options.scales.y.grid.color = gridColor;
                        }
                    }

                    // تحديث ألوان التلميحات
                    if (chart.options.plugins && chart.options.plugins.tooltip) {
                        chart.options.plugins.tooltip.backgroundColor = this.isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)';
                        chart.options.plugins.tooltip.titleColor = '#ffffff';
                        chart.options.plugins.tooltip.bodyColor = '#ffffff';
                    }

                    chart.update();
                }
            });
        }
    }

    // دالة للحصول على الوضع الحالي
    getCurrentMode() {
        return this.isDarkMode ? 'dark' : 'light';
    }

    // دالة لتعيين وضع محدد
    setMode(mode) {
        this.isDarkMode = mode === 'dark';
        this.applyMode();
        this.saveMode();
    }

    // دالة لإعادة تعيين الوضع حسب تفضيل النظام
    resetToSystemPreference() {
        if (window.matchMedia) {
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyMode();
            localStorage.removeItem('darkMode');
        }
    }
}

// تهيئة تحكم الوضع الداكن عند تحميل الصفحة
let darkModeController;
document.addEventListener('DOMContentLoaded', () => {
    darkModeController = new DarkModeController();
});

// تصدير للاستخدام الخارجي
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeController;
}

