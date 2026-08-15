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

  test('contains actual report visualization and inline workflow actions', () => {
    expect(source).toContain('renderReportCharts');
    expect(source).toContain("draw('attendanceChart'");
    expect(source).toContain("draw('equipmentChart'");
    expect(source).toContain('reportRevenueTotal');
    expect(source).toContain('reportAttendanceTotal');
    expect(source).toContain('reportExpiringTotal');
    expect(source).toContain('updateReportSummary');
    expect(source).toContain('element.textContent = String(value)');
    expect(source).toContain('exportWorkflowReport');
    expect(source).not.toContain('window.prompt(');
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
