const fs = require('fs');
const path = require('path');

describe('Professional dashboard data states', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../../scripts/professional_dashboard.js'),
    'utf8'
  );

  test('renders bilingual empty states for dashboard collections', () => {
    expect(source).toContain('لا توجد إشعارات / No notifications');
    expect(source).toContain('لا توجد أنشطة حديثة / No recent activity');
    expect(source).toContain('لا توجد تنبيهات مهمة / No important alerts');
  });

  test('renders bilingual error state with retry handling', () => {
    expect(source).toContain('تعذر تحميل البيانات / Unable to load data');
    expect(source).toContain('إعادة المحاولة / Retry');
    expect(source).toContain('renderDashboardErrorState');
  });
});
