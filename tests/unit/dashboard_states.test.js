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

  test('supports bilingual autosave status and destructive-action confirmation', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../frontend/professional_dashboard.html'), 'utf8');
    expect(html).toContain('classSaveStatus');
    expect(html).toContain('roomSaveStatus');
    expect(html).toContain('equipmentSaveStatus');
    expect(source).toContain('setupWorkflowAutosave');
    expect(source).toContain('Draft autosaved');
    expect(source).toContain('Confirmed and saved');
    expect(source).toContain('Confirm deletion?');
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

  test('persists and restores drafts for room, class, and equipment forms', () => {
    const fields = {};
    const statuses = {};
    const storage = new Map();
    global.localStorage = {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    };
    global.document = {
      getElementById: id => fields[id] || statuses[id] || null,
      createElement: () => ({ textContent: '' }),
      head: { appendChild: () => {} },
      addEventListener: () => {},
      querySelectorAll: () => []
    };
    const ProfessionalDashboard = require('../../scripts/professional_dashboard');

    const makeField = value => ({ value });
    const dashboard = Object.create(ProfessionalDashboard.prototype);
    dashboard.workflowDraftKeyPrefix = 'pulseforge.workflowDraft.';
    dashboard.setWorkflowSaveStatus = (type, text, tone) => { statuses[`${type}SaveStatus`] = { textContent: text, dataset: { tone } }; };
    dashboard.autosaveTimers = {};

    const configs = {
      room: { roomId: '', roomName: 'Main Room', roomCapacity: '40', roomStatus: 'active' },
      class: { classId: '', classTitle: 'Strength', classSchedule: 'Mon 18:00', classCapacity: '20' },
      equipment: { equipmentId: '', equipmentName: 'Treadmill', equipmentManufacturer: 'PulseForge', equipmentStatus: 'operational' }
    };

    Object.entries(configs).forEach(([type, values]) => {
      Object.entries(values).forEach(([id, value]) => { fields[id] = makeField(value); });
      dashboard.saveWorkflowDraft(type);
      Object.values(fields).forEach(field => { field.value = ''; });
      dashboard.restoreWorkflowDraft(type);
      Object.entries(values).forEach(([id, value]) => expect(fields[id].value).toBe(value));
      expect(statuses[`${type}SaveStatus`].dataset.tone).toBe('restored');
      storage.delete(`${dashboard.workflowDraftKeyPrefix}${type}`);
    });
  });
