# PulseForge Gym Management Desktop

> **Important:** This repository is the legacy Electron/Desktop application. Its `npm run web` command is only a static UI inspection server and is not the modern React web dashboard. If that command shows a welcome message with one button, the behavior is expected for this legacy repository. The full web dashboard is maintained separately at [`tahadeab/Gym-Management-Web`](https://github.com/tahadeab/Gym-Management-Web).

PulseForge Gym Management Desktop is a privacy-first Electron application for gyms, fitness studios, sports clubs, and multi-branch operations. It stores operational data locally in SQLite and provides bilingual staff workflows for members, subscriptions, payments, attendance, trainers, classes, equipment, reports, exports, and notifications.

The application supports **English/LTR** and **Arabic/RTL**. The selected language is persisted locally and restored on the next launch.

## Capabilities

| Area | Included capabilities |
|---|---|
| Access control | Password hashing, admin/staff roles, session-aware IPC, and controlled renderer access |
| Members | Profiles, contact and emergency details, medical notes, status, search, and filtering |
| Subscriptions | New subscriptions, renewals, expiry tracking, and payment-linked updates |
| Payments | Payment history, methods, revenue metrics, and staff ownership controls |
| Attendance | Check-in/check-out, activity type, notes, latest visits, and reporting |
| Trainers | Profiles, specialties, contact data, active status, and relationship views |
| Classes | Scheduling, trainer assignment, capacity, pricing, and member bookings |
| Equipment | Inventory, purchase information, status, maintenance dates, notes, and admin controls |
| Reports | Revenue trends, attendance trends, subscription expiry indicators, and export foundation |
| Interface | Responsive desktop layout, bilingual labels, RTL/LTR switching, dark-mode assets, and toast feedback |

## Technology and security model

The application uses Electron 37, Node.js, SQLite3, bcryptjs, Chart.js, jsPDF, XLSX, DOMPurify, Jest, and Playwright. The renderer runs with `nodeIntegration: false` and `contextIsolation: true`; renderer actions communicate through the controlled preload bridge. The SQLite database is created in Electron's operating-system user-data directory rather than inside the repository.

## Requirements

Install Node.js 20 or newer and npm. The application targets Windows, macOS, and Linux. For a small single-site installation, at least 4 GB RAM and 500 MB free disk space are recommended.

## Installation

```bash
git clone https://github.com/tahadeab/GYM-Management-System.git
cd GYM_SYSTEM-2.0
npm install
```

For first-run configuration, copy `.env.example` to `.env` when the file is available and set `ADMIN_PASSWORD` to a strong private password. If no password is supplied, the database may create a temporary random administrator password and print a warning; change it immediately after first login. Never commit `.env`, database files, backups, generated reports, or customer data.

## Running

```bash
npm start
```

For a quick static UI inspection only:

```bash
npm run web
```

The `web` command serves the legacy repository's static files on port 8080 and is intentionally not the full web application. On Windows, if Python is not installed, the fallback command may use the Python Microsoft Store alias and still serve the existing static files; this does not install or launch the modern web dashboard. To run the full web dashboard, clone [`tahadeab/Gym-Management-Web`](https://github.com/tahadeab/Gym-Management-Web), install pnpm, and run `pnpm install` followed by `pnpm dev`.

## Windows PowerShell troubleshooting

Use `Get-Location` and `Get-ChildItem` first to confirm which repository is open. If the path is `GYM-Management-System`, you are in the legacy Electron/Desktop project. Running `npm run web` there intentionally serves a small static inspection page on port 8080; a welcome message with one button is not the modern dashboard.

```powershell
# Legacy Electron/Desktop app
cd D:\path\to\GYM-Management-System
npm install
npm start

# Modern React Web/PWA app
cd D:\path\to\Gym-Management-Web
pnpm install
pnpm dev
```

If PowerShell reports `Python was not found`, Windows could not resolve the `python3` command used by the legacy static-server fallback. This warning does not indicate that Electron or the modern web application is installed incorrectly. Stop the static server with `Ctrl+C`, switch to `Gym-Management-Web`, and run `pnpm dev`. Install Python only if you specifically need the legacy static inspection command.

## Testing and quality checks

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run check
npm run lint
npm run test:coverage
```

Jest runs the unit and integration JavaScript tests. Playwright tests use the dedicated `test:e2e` command. The syntax check validates the main process, preload bridge, database code, and script files. The complete bilingual user manual is available at [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md).

## Data, export, and backup

Use the application export action to create a JSON backup before upgrades or migrations. Store backups outside the application directory and test restoration periodically. Do not place real customer records in GitHub or issue trackers. Production installations should use signed installers, encrypted backups, a private environment file, and a documented restore test.

## Project layout

```text
main.js                       Electron main process and IPC handlers
preload.js                    Secure renderer API bridge
database/improved_db.js       SQLite schema, business logic, RBAC, and reporting
frontend/                     Login and dashboard pages
scripts/                      UI controllers and bilingual runtime
styles/                       Page styles and language-switcher styles
assets/                       Branding and interface assets
tests/                        Unit, integration, and Playwright tests
docs/USER_GUIDE.md            Complete bilingual user guide
docs/DESKTOP_PARITY_AUDIT.md  Verified desktop/web feature parity matrix
```

## Release procedure and installer packaging

The repository uses `electron-builder` to package the desktop application. The configured Windows target is an NSIS installer with a selectable installation directory, Start Menu shortcut, and Desktop shortcut.

```powershell
npm install
npm run check
npm test
npm run build
npm run dist:win
```

`npm run dist:dir` creates an unpacked application for local packaging verification. `npm run dist:win` creates `release/PulseForge-Gym-Management-Setup-1.0.0.exe` or the equivalent versioned filename. Build the final Windows installer on Windows or a configured CI runner for the most reliable result. Cross-building from Linux requires a working Wine environment and may fail during the installer validation step. The installer currently uses the default Electron icon; add a reviewed `.ico` asset before publishing a branded production release.

## Final verification notes

The final validation completed the JavaScript syntax check and all 55 Jest tests. The unpacked Electron package was generated successfully with electron-builder; NSIS installer generation is configured and should be finalized on Windows or CI because the sandbox Linux environment lacks a fully compatible Wine runtime. The test environment correctly reports a security warning when `ADMIN_PASSWORD` is absent and generates a temporary administrator password for development. Production operators must set a strong private `ADMIN_PASSWORD` before first launch and change any temporary password immediately. The web and mobile projects have separate README files and MIT licenses, while mobile bearer-token entry and native push notification delivery remain transitional deployment concerns described in the mobile documentation.

## Arabic summary

PulseForge Gym Management Desktop هو تطبيق سطح مكتب احترافي مبني على Electron وNode.js وSQLite لإدارة الجيم. يدعم الأعضاء والاشتراكات والمدفوعات والحضور والمدربين والحصص والمعدات والتقارير والتصدير والتنبيهات، مع دعم كامل للعربية باتجاه RTL والإنجليزية باتجاه LTR.

تُخزن قاعدة البيانات محلياً داخل مجلد بيانات Electron، ويجب إجراء نسخ احتياطية واختبار استعادتها قبل أي ترقية. يحتوي مجلد `docs` على دليل استخدام ثنائي اللغة.

## Related modern applications

| Application | Repository | Correct local command |
|---|---|---|
| Legacy Electron/Desktop | [`GYM-management-system`](https://github.com/tahadeab/GYM-management-system) | `npm start` |
| Modern React Web/PWA | [`Gym-Management-Web`](https://github.com/tahadeab/Gym-Management-Web) | `pnpm dev` |
| Expo Mobile companion | [`gym-management-mobile`](https://github.com/tahadeab/gym-management-mobile) | `npx expo start` |

Do not run `npm run web` from this repository when you expect the full React dashboard; it is only a static inspection command.

## License

This project is distributed under the MIT License. See [`LICENSE`](./LICENSE).

## Maintainer

Maintained by **taha deab**.

<!-- Desktop UI and installer enhancement work is tracked in the active project plan. -->
