const fs = require('fs');
const os = require('os');
const path = require('path');
const ImprovedDatabase = require('../database/improved_db');

(async () => {
  const file = path.join(os.tmpdir(), `gym-smoke-${Date.now()}.db`);
  const db = new ImprovedDatabase(file);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const admin = await db.authenticateUser('admin', process.env.ADMIN_PASSWORD || 'invalid');
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  if (!tables.some((table) => table.name === 'attendance')) throw new Error('attendance table missing');
  if (!tables.some((table) => table.name === 'equipment')) throw new Error('equipment table missing');
  const backup = await db.exportAllData();
  if (!backup.data.members || !backup.data.classes) throw new Error('backup export incomplete');
  db.close();
  fs.rmSync(file, { force: true });
  console.log(JSON.stringify({ ok: true, tableCount: tables.length, adminConfigured: Boolean(admin) }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
