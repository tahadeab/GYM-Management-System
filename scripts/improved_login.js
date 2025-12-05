const { ipcRenderer } = require('electron');
const db = require('../database/improved_db');
const Helpers = require('../scripts/helpers');

class ImprovedLoginManager {
    constructor() {
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 دقيقة
        this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
        this.init();
    }

    init() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // إضافة تأثيرات بصرية محسنة
        this.addVisualEffects();
        
        // إضافة دعم Caps Lock
        this.addCapsLockDetection();
        
        // إضافة دعم Remember Me
        this.addRememberMeFeature();
        
        // التحقق من الجلسة المحفوظة
        this.checkSavedSession();
        
        // إضافة حماية من الهجمات
        this.addSecurityFeatures();
    }

    addVisualEffects() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
                this.clearErrors();
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });

            // إضافة تأثير الكتابة
            input.addEventListener('input', () => {
                this.validateInputRealTime(input);
            });
        });

        // إضافة تأثير hover للأزرار
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    addCapsLockDetection() {
        const passwordInput = document.getElementById('password');
        const capsLockWarning = document.createElement('div');
        capsLockWarning.className = 'caps-lock-warning';
        capsLockWarning.textContent = 'تحذير: Caps Lock مفعل';
        capsLockWarning.style.display = 'none';
        passwordInput.parentElement.appendChild(capsLockWarning);

        passwordInput.addEventListener('keydown', (e) => {
            const capsLockOn = e.getModifierState && e.getModifierState('CapsLock');
            capsLockWarning.style.display = capsLockOn ? 'block' : 'none';
        });
    }

    addRememberMeFeature() {
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) {
            // استرجاع اسم المستخدم المحفوظ
            const savedUsername = localStorage.getItem('rememberedUsername');
            if (savedUsername) {
                document.getElementById('username').value = savedUsername;
                rememberCheckbox.checked = true;
            }
        }
    }

    checkSavedSession() {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const now = new Date().getTime();
                
                // التحقق من انتهاء صلاحية الجلسة
                if (now - session.loginTime < this.sessionTimeout) {
                    this.showInfo('لديك جلسة نشطة. جاري الانتقال إلى لوحة التحكم...');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    // انتهت صلاحية الجلسة
                    localStorage.removeItem('userSession');
                    this.showWarning('انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.');
                }
            } catch (error) {
                localStorage.removeItem('userSession');
            }
        }
    }

    addSecurityFeatures() {
        // حماية من copy/paste في حقل كلمة المرور
        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('paste', (e) => {
            e.preventDefault();
            this.showWarning('لا يمكن لصق كلمة المرور لأسباب أمنية');
        });

        // إضافة تأخير تدريجي للمحاولات الفاشلة
        this.loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        this.lastFailedAttempt = parseInt(localStorage.getItem('lastFailedAttempt') || '0');
        
        // التحقق من حالة القفل
        this.checkLockoutStatus();
    }

    checkLockoutStatus() {
        const now = new Date().getTime();
        if (this.loginAttempts >= this.maxLoginAttempts) {
            const timeSinceLastAttempt = now - this.lastFailedAttempt;
            if (timeSinceLastAttempt < this.lockoutDuration) {
                const remainingTime = Math.ceil((this.lockoutDuration - timeSinceLastAttempt) / 60000);
                this.lockForm(`تم قفل النظام بسبب المحاولات الفاشلة المتكررة. يرجى المحاولة بعد ${remainingTime} دقيقة`);
                return true;
            } else {
                // انتهت فترة القفل
                this.resetLoginAttempts();
            }
        }
        return false;
    }

    lockForm(message) {
        this.form.querySelector('button[type="submit"]').disabled = true;
        this.form.querySelectorAll('input').forEach(input => input.disabled = true);
        this.showError(message);
    }

    unlockForm() {
        this.form.querySelector('button[type="submit"]').disabled = false;
        this.form.querySelectorAll('input').forEach(input => input.disabled = false);
    }

    resetLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastFailedAttempt');
        this.unlockForm();
    }

    validateInputRealTime(input) {
        const value = input.value;
        const inputType = input.type;
        
        // إزالة رسائل الخطأ السابقة
        const existingError = input.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        let errorMessage = '';
        
        if (inputType === 'text' && input.id === 'username') {
            if (value.length > 0 && value.length < 3) {
                errorMessage = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
            } else if (value.length > 50) {
                errorMessage = 'اسم المستخدم طويل جداً';
            }
        } else if (inputType === 'password') {
            if (value.length > 0 && value.length < 6) {
                errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
            }
        }

        if (errorMessage) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errorMessage;
            input.parentElement.appendChild(errorDiv);
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        // التحقق من حالة القفل
        if (this.checkLockoutStatus()) {
            return;
        }
        
        const formData = new FormData(this.form);
        const username = Helpers.sanitizeInput(formData.get('username'));
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';
        
        // التحقق من المدخلات
        const errors = this.validateInputs(username, password);
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return;
        }
        
        try {
            // إظهار حالة التحميل
            this.showLoading();
            
            // تسجيل محاولة الدخول
            this.logLoginAttempt(username);
            
            // محاولة تسجيل الدخول
            const user = await db.authenticateUser(username, password);
            
            if (user) {
                // تسجيل الدخول ناجح
                this.resetLoginAttempts();
                this.loginSuccess(user, rememberMe);
            } else {
                // فشل تسجيل الدخول
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
            this.handleFailedLogin();
        } finally {
            this.hideLoading();
        }
    }

    handleFailedLogin() {
        this.loginAttempts++;
        this.lastFailedAttempt = new Date().getTime();
        
        localStorage.setItem('loginAttempts', this.loginAttempts.toString());
        localStorage.setItem('lastFailedAttempt', this.lastFailedAttempt.toString());
        
        const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
        
        if (remainingAttempts > 0) {
            this.showError(`اسم المستخدم أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${remainingAttempts}`);
        } else {
            this.lockForm('تم قفل النظام بسبب المحاولات الفاشلة المتكررة');
        }
    }

    logLoginAttempt(username) {
        const attempts = JSON.parse(localStorage.getItem('loginLog') || '[]');
        attempts.push({
            username: username,
            timestamp: new Date().toISOString(),
            ip: 'localhost', // في بيئة Electron
            userAgent: navigator.userAgent
        });
        
        // الاحتفاظ بآخر 100 محاولة فقط
        if (attempts.length > 100) {
            attempts.splice(0, attempts.length - 100);
        }
        
        localStorage.setItem('loginLog', JSON.stringify(attempts));
    }

    validateInputs(username, password) {
        const errors = [];
        
        if (!username || username.trim() === '') {
            errors.push('اسم المستخدم مطلوب');
        } else if (username.length < 3) {
            errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        } else if (username.length > 50) {
            errors.push('اسم المستخدم طويل جداً');
        }
        
        if (!password || password.trim() === '') {
            errors.push('كلمة المرور مطلوبة');
        } else if (password.length < 6) {
            errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        
        // التحقق من الأحرف المسموحة
        const usernameRegex = /^[a-zA-Z0-9_\u0600-\u06FF]+$/;
        if (username && !usernameRegex.test(username)) {
            errors.push('اسم المستخدم يحتوي على أحرف غير مسموحة');
        }
        
        return errors;
    }

    showError(message) {
        this.clearMessages();
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'message error-message';
        
        // إضافة تأثير اهتزاز
        this.errorMessage.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            this.errorMessage.style.animation = '';
        }, 500);
    }

    showSuccess(message) {
        this.clearMessages();
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'message success-message';
    }

    showWarning(message) {
        this.clearMessages();
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'message warning-message';
    }

    showInfo(message) {
        this.clearMessages();
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.className = 'message info-message';
    }

    clearMessages() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.className = 'message';
    }

    clearErrors() {
        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());
        
        const errorInputs = document.querySelectorAll('input.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> جاري تسجيل الدخول...';
    }

    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'تسجيل الدخول';
    }

    loginSuccess(user, rememberMe) {
        // حفظ بيانات المستخدم في localStorage
        const sessionData = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            loginTime: new Date().getTime(),
            sessionId: Helpers.generateId()
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        
        // حفظ اسم المستخدم إذا تم اختيار "تذكرني"
        if (rememberMe) {
            localStorage.setItem('rememberedUsername', user.username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }
        
        // تسجيل نجاح تسجيل الدخول
        this.logSuccessfulLogin(user);
        
        // إظهار رسالة نجاح
        this.showSuccess(`مرحباً ${user.full_name || user.username}! تم تسجيل الدخول بنجاح. جاري الانتقال...`);
        
        // الانتقال إلى لوحة التحكم بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }

    logSuccessfulLogin(user) {
        const successLog = JSON.parse(localStorage.getItem('successfulLogins') || '[]');
        successLog.push({
            userId: user.id,
            username: user.username,
            timestamp: new Date().toISOString(),
            ip: 'localhost'
        });
        
        // الاحتفاظ بآخر 50 تسجيل دخول ناجح
        if (successLog.length > 50) {
            successLog.splice(0, successLog.length - 50);
        }
        
        localStorage.setItem('successfulLogins', JSON.stringify(successLog));
    }
}

// تهيئة مدير تسجيل الدخول المحسن عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new ImprovedLoginManager();
});

// إضافة دعم Enter للانتقال بين الحقول
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        const inputs = Array.from(document.querySelectorAll('input:not([disabled])'));
        const currentIndex = inputs.indexOf(activeElement);
        
        if (currentIndex < inputs.length - 1) {
            e.preventDefault();
            inputs[currentIndex + 1].focus();
        }
    }
});

// إضافة حماية من F12 و DevTools (اختياري)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
    }
});

// إضافة حماية من النقر بالزر الأيمن (اختياري)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

