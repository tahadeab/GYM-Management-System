const DOMPurify = require('dompurify');
const validator = require('validator');
const dayjs = require('dayjs');

class Helpers {
    // تنظيف المدخلات
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return DOMPurify.sanitize(input.trim());
    }

    // التحقق من صحة البريد الإلكتروني
    static isValidEmail(email) {
        return validator.isEmail(email);
    }

    // التحقق من صحة رقم الهاتف
    static isValidPhone(phone) {
        return validator.isMobilePhone(phone, 'ar-SA') || validator.isMobilePhone(phone, 'any');
    }

    // تنسيق التاريخ
    static formatDate(date, format = 'YYYY-MM-DD') {
        return dayjs(date).format(format);
    }

    // تنسيق الوقت
    static formatTime(time, format = 'HH:mm') {
        return dayjs(time).format(format);
    }

    // تنسيق العملة
    static formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    }

    // التحقق من صحة البيانات المطلوبة
    static validateRequired(data, fields) {
        const errors = [];
        fields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push(`حقل ${field} مطلوب`);
            }
        });
        return errors;
    }

    // نموذج حالة واجهة موحد ثنائي اللغة للتدفقات المختلفة
    static getBilingualState(type = 'empty', detail = '') {
        const states = {
            loading: { title: 'جاري التحميل / Loading', message: 'يرجى الانتظار أثناء جلب البيانات.' },
            empty: { title: 'لا توجد بيانات / No data', message: detail || 'لا توجد سجلات متاحة حالياً.' },
            success: { title: 'تمت العملية / Completed', message: detail || 'تم تنفيذ العملية بنجاح.' },
            error: { title: 'تعذر إكمال العملية / Unable to complete', message: detail || 'حدث خطأ. حاول مرة أخرى.' }
        };
        return { type, ...(states[type] || states.error), retryLabel: 'إعادة المحاولة / Retry' };
    }

    // إنشاء معرف فريد
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // حساب عمر الاشتراك
    static calculateSubscriptionAge(startDate, endDate) {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const now = dayjs();
        
        if (now.isAfter(end)) {
            return { status: 'expired', days: now.diff(end, 'day') };
        } else if (now.isBefore(start)) {
            return { status: 'pending', days: start.diff(now, 'day') };
        } else {
            return { status: 'active', days: end.diff(now, 'day') };
        }
    }

    // تنسيق حالة العضو
    static formatMemberStatus(status) {
        const statusMap = {
            'active': 'نشط',
            'inactive': 'غير نشط',
            'suspended': 'معلق'
        };
        return statusMap[status] || status;
    }

    // تنسيق نوع الاشتراك
    static formatMembershipType(type) {
        const typeMap = {
            'monthly': 'شهري',
            'quarterly': 'ربع سنوي',
            'yearly': 'سنوي',
            'daily': 'يومي'
        };
        return typeMap[type] || type;
    }

    // تنسيق طريقة الدفع
    static formatPaymentMethod(method) {
        const methodMap = {
            'cash': 'نقداً',
            'card': 'بطاقة ائتمان',
            'bank_transfer': 'تحويل بنكي',
            'online': 'دفع إلكتروني'
        };
        return methodMap[method] || method;
    }

    // إنشاء كلمة مرور قوية
    static generateStrongPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // التحقق من قوة كلمة المرور
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push(`كلمة المرور يجب أن تكون ${minLength} أحرف على الأقل`);
        if (!hasUpperCase) errors.push('يجب أن تحتوي على حرف كبير');
        if (!hasLowerCase) errors.push('يجب أن تحتوي على حرف صغير');
        if (!hasNumbers) errors.push('يجب أن تحتوي على رقم');
        if (!hasSpecialChar) errors.push('يجب أن تحتوي على رمز خاص');

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // تنسيق حجم الملف
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // إنشاء QR Code للعضو
    static generateMemberQR(memberId) {
        return `GYM-${memberId}-${Date.now()}`;
    }

    // حساب الإحصائيات
    static calculateStats(data) {
        const total = data.length;
        const active = data.filter(item => item.status === 'active').length;
        const inactive = total - active;
        
        return {
            total,
            active,
            inactive,
            activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
        };
    }

    // تصدير البيانات كـ CSV
    static exportToCSV(data, headers) {
        const csvContent = [
            headers.join(','),
            ...data.map(row => Object.values(row).map(value => `"${value}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // إنشاء نسخة احتياطية من البيانات
    static createBackup(data) {
        return {
            timestamp: new Date().toISOString(),
            data: data,
            version: '1.0'
        };
    }
}

module.exports = Helpers; 