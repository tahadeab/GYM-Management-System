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

  test('includes concrete workflow surfaces beyond the dashboard shell', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../frontend/professional_dashboard.html'), 'utf8');
    expect(html).toContain('classesTableContainer');
    expect(html).toContain('roomsTableContainer');
    expect(html).toContain('equipmentTableContainer');
    expect(html).toContain('reportsStateContainer');
    expect(html).toContain('Export Excel');
  });

  test('renders bilingual error state with retry handling', () => {
    expect(source).toContain('تعذر تحميل البيانات / Unable to load data');
    expect(source).toContain('إعادة المحاولة / Retry');
    expect(source).toContain('renderDashboardErrorState');
    expect(source).toContain('loadWorkflowPageData');
    expect(source).toContain('renderWorkflowError');
    expect(source).toContain('escapeHtml');
  });
});
