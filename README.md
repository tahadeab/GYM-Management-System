# Gym Management System

A professional, privacy-first desktop gym management system built with Electron, Node.js, and SQLite. The application is designed for gyms, fitness studios, sports clubs, and multi-branch fitness operations that need reliable member, payment, attendance, trainer, class, equipment, and reporting workflows in one place.

> **Bilingual by design:** the application supports both **Arabic and English**, including RTL/LTR layout switching. The selected language is stored locally and restored on the next launch.

## Core capabilities

| Area | Included capabilities |
|---|---|
| Authentication | Secure password hashing, role-based access control, session-aware IPC, admin and staff roles |
| Members | Member profiles, contact and emergency information, medical notes, membership status, subscription dates, search and filtering |
| Subscriptions | New subscriptions, renewals, expiry tracking, payment-linked subscription updates |
| Payments | Payment history, payment methods, revenue dashboard metrics, staff ownership controls |
| Attendance | Check-in/check-out records, activity type, notes, latest visits, attendance reporting |
| Trainers | Trainer profiles, specialties, contact information, status, ownership-aware CRUD |
| Classes | Class scheduling records, trainer assignment, capacity, pricing, and member bookings |
| Equipment | Equipment inventory, purchase information, status, maintenance dates, notes, admin deletion controls |
| Dashboard | Member, trainer, payment, attendance, revenue, and expiry indicators |
| Reports | Revenue trends, attendance trends, and subscriptions expiring within 30 days |
| Data protection | SQLite persistence in the operating system user-data directory, JSON export foundation, activity-oriented schema |
| UI and accessibility | Responsive desktop layout, Arabic RTL support, English LTR support, dark mode assets, toast feedback |

## Technology stack

The project uses Electron 37, Node.js, SQLite3, bcryptjs, Chart.js, jsPDF, XLSX, DOMPurify, Jest, and Playwright. The renderer runs with `nodeIntegration: false` and `contextIsolation: true`; renderer features communicate through a controlled preload API.

## Requirements

Install Node.js 20 or newer and npm. The application is intended for Windows, macOS, and Linux. A minimum 4 GB of RAM and 500 MB of free disk space is recommended for a small single-site installation.

## Installation

```bash
git clone https://github.com/tahadeab/GYM-Management-System.git
cd GYM_SYSTEM-2.0
npm install
```

For first-run configuration, copy `.env.example` to `.env` and set `ADMIN_PASSWORD` to a strong, private password. If it is omitted, the database creates a temporary random administrator password and prints a security warning; change it immediately after the first login.

## Running the application

```bash
npm start
```

To serve the static files for a quick UI inspection:

```bash
npm run web
```

## Testing and quality checks

```bash
npm test                 # Jest unit and integration tests
npm run test:e2e         # Playwright Electron end-to-end tests
npm run lint             # ESLint validation
npm run check            # JavaScript syntax validation
npm run test:coverage    # Coverage report
```

Jest intentionally runs only `*.test.js` files. Playwright `*.spec.js` files are excluded from Jest and are executed through the dedicated E2E command.

## User Guide

Read the complete bilingual manual in [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md). It covers installation, roles, monthly subscriptions, payments, attendance, automatic notifications, reports, backup, and troubleshooting in English and Arabic.

## Project structure

```text
.
├── main.js                       # Electron main process and IPC handlers
├── preload.js                    # Secure renderer API bridge
├── database/improved_db.js       # SQLite schema, business logic, RBAC, reporting
├── frontend/                     # Login and dashboard HTML pages
├── scripts/                      # UI controllers and bilingual runtime
├── styles/                       # Page styles and language-switcher styles
├── assets/                       # Branding and interface assets
├── tests/                        # Unit, integration, and Playwright tests
└── package.json                  # Commands and dependencies
```

## Security notes

Passwords are hashed with bcryptjs and should never be committed to source control. The SQLite database is created under Electron's `userData` directory rather than inside the repository. External links are restricted to HTTP and HTTPS, and renderer access to Node.js is disabled. Production deployments should additionally use signed installers, encrypted backups, a private `.env` file, and a documented restore test.

## Data and backup guidance

Use the application's export action to create a JSON backup before upgrades or migration. Store backups outside the application directory and test restoration periodically. Never commit `*.db`, `.env`, generated reports, or customer data to GitHub.

## Default access

For security, no permanent password is documented in this repository. Set `ADMIN_PASSWORD` before first launch. The application may generate a one-time temporary password when the variable is missing.

## Contributing

Create a feature branch, keep changes focused, run the syntax check and relevant tests, and open a pull request with a clear description of the user workflow affected. Do not include real customer data, database files, credentials, or private screenshots.

## License

This project is provided for educational and operational customization. Add an organization-specific open-source license before public redistribution.

## Maintainer

Maintained by **tahadeab** with a bilingual product direction for international gym operations.
