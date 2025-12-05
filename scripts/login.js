const { ipcRenderer } = require('electron');
const db = require('../database/db');
const Helpers = require('../scripts/helpers');

class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // إضافة تأثيرات بصرية
        this.addVisualEffects();
    }

    addVisualEffects() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const username = Helpers.sanitizeInput(formData.get('username'));
        const password = formData.get('password');
        
        // التحقق من المدخلات
        const errors = this.validateInputs(username, password);
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return;
        }
        
        try {
            // إظهار حالة التحميل
            this.showLoading();
            
            // محاولة تسجيل الدخول
            const user = await db.authenticateUser(username, password);
            
            if (user) {
                // تسجيل الدخول ناجح
                this.loginSuccess(user);
            } else {
                // فشل تسجيل الدخول
                this.showError('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        } finally {
            this.hideLoading();
        }
    }

    validateInputs(username, password) {
        const errors = [];
        
        if (!username || username.trim() === '') {
            errors.push('اسم المستخدم مطلوب');
        }
        
        if (!password || password.trim() === '') {
            errors.push('كلمة المرور مطلوبة');
        }
        
        if (username.length < 3) {
            errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        }
        
        if (password.length < 6) {
            errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        
        return errors;
    }

    showError(message) {
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        
        // إخفاء رسالة الخطأ بعد 5 ثواني
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري تسجيل الدخول...';
    }

    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
    }

    loginSuccess(user) {
        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        }));
        
        // إظهار رسالة نجاح
        this.showSuccess('تم تسجيل الدخول بنجاح! جاري الانتقال...');
        
        // الانتقال إلى لوحة التحكم بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }

    showSuccess(message) {
        this.errorMessage.style.background = '#27ae60';
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
    }
}

// تهيئة مدير تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// إضافة دعم Enter للانتقال بين الحقول
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        const inputs = Array.from(document.querySelectorAll('input'));
        const currentIndex = inputs.indexOf(activeElement);
        
        if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        } else {
            // إذا كان آخر حقل، قم بتسجيل الدخول
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
    }
}); 