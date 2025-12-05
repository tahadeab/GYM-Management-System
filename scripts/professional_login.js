// نظام إدارة الجيم المتطور - سكريپت تسجيل الدخول الاحترافي
class ProfessionalLogin {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.loginButton = document.getElementById('loginButton');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.toastContainer = document.getElementById('toastContainer');

        this.isLoading = false;
        this.maxAttempts = 5;
        this.attemptCount = 0;
        this.lockoutTime = 15 * 60 * 1000; // 15 دقيقة

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedCredentials();
        this.checkLockoutStatus();
        this.setupFormValidation();
        this.setupAccessibility();
    }

    bindEvents() {
        // أحداث النموذج
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // تبديل إظهار كلمة المرور
        this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());

        // أحداث لوحة المفاتيح
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // أحداث التركيز والتفاعل
        this.usernameInput.addEventListener('input', () => this.clearError());
        this.passwordInput.addEventListener('input', () => this.clearError());

        // تأثيرات بصرية للحقول
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.handleInputFocus(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
        });

        // منع النسخ واللصق في حقل كلمة المرور (اختياري)
        this.passwordInput.addEventListener('paste', (e) => {
            // يمكن تفعيل هذا للأمان الإضافي
            // e.preventDefault();
            // this.showToast('لا يمكن لصق كلمة المرور لأسباب أمنية', 'warning');
        });
    }

    setupFormValidation() {
        // التحقق من صحة البيانات في الوقت الفعلي
        this.usernameInput.addEventListener('input', () => {
            this.validateUsername();
        });

        this.passwordInput.addEventListener('input', () => {
            this.validatePassword();
        });
    }

    setupAccessibility() {
        // تحسينات الوصولية
        this.form.setAttribute('novalidate', 'true');

        // إضافة تسميات ARIA
        this.usernameInput.setAttribute('aria-describedby', 'username-help');
        this.passwordInput.setAttribute('aria-describedby', 'password-help');

        // تحسين التنقل بلوحة المفاتيح
        const focusableElements = this.form.querySelectorAll(
            'input, button, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    // منطق التنقل المخصص إذا لزم الأمر
                }
            });
        });
    }

    validateUsername() {
        const username = this.usernameInput.value.trim();
        const isValid = username.length >= 3;

        this.updateFieldValidation(this.usernameInput, isValid);
        return isValid;
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const isValid = password.length >= 4;

        this.updateFieldValidation(this.passwordInput, isValid);
        return isValid;
    }

    updateFieldValidation(input, isValid) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    handleInputFocus(e) {
        const inputGroup = e.target.closest('.form-group');
        inputGroup.classList.add('focused');
    }

    handleInputBlur(e) {
        const inputGroup = e.target.closest('.form-group');
        inputGroup.classList.remove('focused');
    }

    handleKeydown(e) {
        // اختصارات لوحة المفاتيح
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.handleSubmit(e);
                    break;
            }
        }

        // الهروب لإلغاء العملية
        if (e.key === 'Escape') {
            this.clearForm();
            this.clearError();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isLoading) return;

        // التحقق من حالة القفل
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            return;
        }

        // التحقق من صحة البيانات
        if (!this.validateForm()) {
            this.showError('يرجى التأكد من صحة البيانات المدخلة');
            return;
        }

        const credentials = {
            username: this.usernameInput.value.trim(),
            password: this.passwordInput.value
        };

        try {
            this.setLoading(true);
            await this.performLogin(credentials);
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.handleLoginError(error);
        } finally {
            this.setLoading(false);
        }
    }

    validateForm() {
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();

        return isUsernameValid && isPasswordValid;
    }

    async performLogin(credentials) {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // استخدام Context Bridge للتواصل مع الخادم
            const result = await window.api.login(credentials);

            if (result.success) {
                this.handleLoginSuccess(result.user);
            } else {
                throw new Error(result.message || 'فشل في تسجيل الدخول');
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            // في حالة عدم توفر API (للتطوير فقط)، استخدم التحقق المحلي
            if (!window.api && this.validateCredentialsLocally(credentials)) {
                this.handleLoginSuccess({
                    username: credentials.username,
                    role: 'admin',
                    fullName: 'المدير العام'
                });
            } else {
                throw error; // إعادة رمي الخطأ إذا لم يكن محلياً
            }
        }
    }

    validateCredentialsLocally(credentials) {
        // بيانات تسجيل الدخول الافتراضية
        const validCredentials = [
            { username: 'admin', password: 'admin123' },
            { username: 'employee', password: 'emp123' }
        ];

        return validCredentials.some(cred =>
            cred.username === credentials.username &&
            cred.password === credentials.password
        );
    }

    handleLoginSuccess(user) {
        this.attemptCount = 0;
        this.clearLockout();

        // حفظ بيانات الاعتماد إذا تم تحديد "تذكرني"
        if (this.rememberMeCheckbox.checked) {
            this.saveCredentials();
        }

        // حفظ معلومات المستخدم
        this.saveUserSession(user);

        // إظهار رسالة نجاح
        this.showToast(`مرحباً ${user.fullName || user.username}!`, 'success');

        // الانتقال إلى لوحة التحكم
        setTimeout(() => {
            this.redirectToDashboard();
        }, 1500);
    }

    handleLoginError(error) {
        this.attemptCount++;

        // حفظ عدد المحاولات
        localStorage.setItem('loginAttempts', this.attemptCount.toString());
        localStorage.setItem('lastAttemptTime', Date.now().toString());

        if (this.attemptCount >= this.maxAttempts) {
            this.lockAccount();
            this.showLockoutMessage();
        } else {
            const remainingAttempts = this.maxAttempts - this.attemptCount;
            this.showError(`${error.message}. المحاولات المتبقية: ${remainingAttempts}`);
        }

        // هز النموذج للإشارة إلى الخطأ
        this.shakeForm();
    }

    lockAccount() {
        const lockoutEndTime = Date.now() + this.lockoutTime;
        localStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
        this.showToast('تم قفل الحساب مؤقتاً لأسباب أمنية', 'error');
    }

    isLockedOut() {
        const lockoutEndTime = localStorage.getItem('lockoutEndTime');
        if (!lockoutEndTime) return false;

        return Date.now() < parseInt(lockoutEndTime);
    }

    checkLockoutStatus() {
        if (this.isLockedOut()) {
            this.showLockoutMessage();
            this.disableForm();
        } else {
            this.clearLockout();
        }

        // استرداد عدد المحاولات
        const attempts = localStorage.getItem('loginAttempts');
        if (attempts) {
            this.attemptCount = parseInt(attempts);
        }
    }

    showLockoutMessage() {
        const lockoutEndTime = parseInt(localStorage.getItem('lockoutEndTime'));
        const remainingTime = Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60);

        this.showError(`تم قفل الحساب مؤقتاً. يرجى المحاولة بعد ${remainingTime} دقيقة`);
        this.disableForm();

        // عداد تنازلي
        this.startLockoutCountdown(lockoutEndTime);
    }

    startLockoutCountdown(endTime) {
        const countdown = setInterval(() => {
            const remaining = endTime - Date.now();

            if (remaining <= 0) {
                clearInterval(countdown);
                this.clearLockout();
                this.enableForm();
                this.showToast('تم إلغاء قفل الحساب. يمكنك المحاولة الآن', 'info');
            } else {
                const minutes = Math.ceil(remaining / 1000 / 60);
                this.updateErrorText(`تم قفل الحساب مؤقتاً. يرجى المحاولة بعد ${minutes} دقيقة`);
            }
        }, 1000);
    }

    clearLockout() {
        localStorage.removeItem('lockoutEndTime');
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastAttemptTime');
        this.attemptCount = 0;
    }

    disableForm() {
        this.usernameInput.disabled = true;
        this.passwordInput.disabled = true;
        this.loginButton.disabled = true;
        this.form.classList.add('disabled');
    }

    enableForm() {
        this.usernameInput.disabled = false;
        this.passwordInput.disabled = false;
        this.loginButton.disabled = false;
        this.form.classList.remove('disabled');
    }

    saveCredentials() {
        const credentials = {
            username: this.usernameInput.value.trim(),
            rememberMe: true
        };

        localStorage.setItem('savedCredentials', JSON.stringify(credentials));
    }

    loadSavedCredentials() {
        const saved = localStorage.getItem('savedCredentials');
        if (saved) {
            try {
                const credentials = JSON.parse(saved);
                if (credentials.rememberMe) {
                    this.usernameInput.value = credentials.username;
                    this.rememberMeCheckbox.checked = true;
                    this.passwordInput.focus();
                }
            } catch (error) {
                console.error('خطأ في تحميل البيانات المحفوظة:', error);
            }
        }
    }

    saveUserSession(user) {
        const session = {
            user: user,
            loginTime: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
        };

        sessionStorage.setItem('userSession', JSON.stringify(session));
    }

    redirectToDashboard() {
        // في بيئة Electron
        if (window.api) {
            try {
                window.api.navigateToDashboard();
            } catch (error) {
                console.error('خطأ في التنقل:', error);
            }
        }

        // كبديل، تحميل صفحة لوحة التحكم
        window.location.href = 'professional_dashboard.html';
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        const icon = this.passwordToggle.querySelector('i');

        if (isPassword) {
            this.passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
            this.passwordToggle.setAttribute('aria-label', 'إخفاء كلمة المرور');
        } else {
            this.passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
            this.passwordToggle.setAttribute('aria-label', 'إظهار كلمة المرور');
        }

        // التركيز على الحقل بعد التبديل
        this.passwordInput.focus();
    }

    setLoading(loading) {
        this.isLoading = loading;

        if (loading) {
            this.loginButton.classList.add('loading');
            this.loginButton.disabled = true;
        } else {
            this.loginButton.classList.remove('loading');
            this.loginButton.disabled = false;
        }
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');

        // إخفاء الرسالة تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    updateErrorText(message) {
        this.errorText.textContent = message;
        if (!this.errorMessage.classList.contains('show')) {
            this.errorMessage.classList.add('show');
        }
    }

    clearError() {
        this.errorMessage.classList.remove('show');
    }

    shakeForm() {
        this.form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.form.style.animation = '';
        }, 500);
    }

    clearForm() {
        this.usernameInput.value = '';
        this.passwordInput.value = '';
        this.rememberMeCheckbox.checked = false;
        this.clearError();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

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
}

// إضافة أنماط CSS للتحقق من صحة البيانات
const validationStyles = `
    .form-input.valid {
        border-color: #10b981;
        background-color: rgba(16, 185, 129, 0.05);
    }
    
    .form-input.invalid {
        border-color: #ef4444;
        background-color: rgba(239, 68, 68, 0.05);
    }
    
    .form-group.focused .form-label {
        color: var(--primary-color);
    }
    
    .login-form.disabled {
        opacity: 0.6;
        pointer-events: none;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;

// إضافة الأنماط إلى الصفحة
const styleSheet = document.createElement('style');
styleSheet.textContent = validationStyles;
document.head.appendChild(styleSheet);

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalLogin();
});

// تصدير الكلاس للاستخدام الخارجي
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfessionalLogin;
}

