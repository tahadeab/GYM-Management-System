(() => {
  const translations = {
    'نظام إدارة الجيم': 'Gym Management System',
    'لوحة التحكم': 'Dashboard',
    'الأعضاء': 'Members',
    'المدربين': 'Trainers',
    'المدفوعات': 'Payments',
    'الحضور': 'Attendance',
    'الحصص': 'Classes',
    'المعدات': 'Equipment',
    'التقارير': 'Reports',
    'الإعدادات': 'Settings',
    'تسجيل الخروج': 'Logout',
    'تسجيل الدخول': 'Sign in',
    'اسم المستخدم': 'Username',
    'كلمة المرور': 'Password',
    'حفظ': 'Save',
    'إلغاء': 'Cancel',
    'بحث': 'Search',
    'إضافة عضو جديد': 'Add member',
    'إضافة مدرب جديد': 'Add trainer',
    'الإدارة الذكية لناديك الرياضي': 'Smart management for your fitness business',
    'المدير العام': 'Administrator',
    'نشط': 'Active',
    'غير نشط': 'Inactive',
    'لا توجد بيانات': 'No data available'
  };
  const reverse = Object.fromEntries(Object.entries(translations).map(([ar, en]) => [en, ar]));
  const setLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-en', lang === 'en');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (lang === 'en' && translations[key]) el.textContent = translations[key];
      if (lang === 'ar') el.textContent = key;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = lang === 'en' ? (translations[key] || key) : key;
    });
    localStorage.setItem('gym-language', lang);
    document.querySelectorAll('[data-language]').forEach((button) => button.classList.toggle('active', button.dataset.language === lang));
  };
  const addSwitcher = () => {
    if (document.querySelector('.language-switcher')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'language-switcher';
    wrapper.innerHTML = '<button type="button" data-language="ar">عربي</button><button type="button" data-language="en">English</button>';
    wrapper.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
    document.body.appendChild(wrapper);
  };
  document.addEventListener('DOMContentLoaded', () => {
    addSwitcher();
    const lang = localStorage.getItem('gym-language') || document.documentElement.lang || 'ar';
    setLanguage(lang);
  });
  window.gymI18n = { setLanguage, translations, reverse };
})();
