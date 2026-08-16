# PulseForge Gym Management Web

> **Important:** This is the modern React/tRPC web application. It is different from the legacy Electron repository [`GYM-Management-System`](https://github.com/tahadeab/GYM-management-system), whose `npm run web` command only serves a small static inspection page. If you see a page with one welcome button, you launched the legacy repository rather than this application.

PulseForge Gym Management is a production-oriented bilingual gym operations platform for staff and administrators. It combines a responsive React dashboard, a database-backed TypeScript API, financial reporting, member and subscription lifecycle management, class bookings, attendance, trainer management, personal training, and an installable Progressive Web App (PWA).

The product supports **English with LTR layout** and **Arabic with RTL layout**. The selected language is persisted in the browser and can be changed without a page reload. The same backend can also serve the companion Expo mobile application.

## Product scope

| Module | Included capabilities |
|---|---|
| Dashboard | Member count, active subscriptions, daily revenue, attendance, expiring subscriptions, revenue trends, and payment mix |
| Members | Search, status filtering, create, edit, archive, subscription-status visibility, and XLSX export |
| Subscriptions | Monthly plans, create, renew, freeze, unfreeze, expired/cancelled states, and date-based lifecycle tracking |
| Financial reports | Date-range revenue reports, daily/weekly/monthly aggregation, payment-method analysis, plan analysis, and XLSX export |
| Classes and bookings | Trainer assignment, schedule, capacity, price, booking, and scoped booking cancellation |
| Attendance | Check-in, check-out, activity type, and date-range reporting |
| Trainers | Trainer list, specialty and contact data, class relationships, and PT relationships |
| Personal training | Packages, member assignments, scheduled sessions, completion tracking, and status lifecycle |
| PWA | Web manifest, install metadata, responsive layout, and offline-safe application shell; API responses are not cached |

## Technology

| Layer | Technology |
|---|---|
| Web UI | React 19, Vite, Tailwind CSS 4, shadcn/ui, Recharts |
| API | Express 4, tRPC 11, TypeScript, Zod |
| Database | MySQL/TiDB with Drizzle ORM |
| Authentication | Manus OAuth session cookies and compatible Bearer session headers |
| Export | XLSX workbook generation |
| Mobile companion | Expo SDK 57, React Native 0.86, React Navigation |
| Testing | Vitest and TypeScript compiler checks |

## Requirements

Use Node.js 20 or newer and pnpm 10. A MySQL or TiDB database is required for protected business data. Never commit credentials, session tokens, exported member information, `.env` files, database dumps, or customer data.

The managed environment supplies platform variables such as `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, and the built-in service configuration. For an independent deployment, provide equivalent values through the hosting provider's secret manager rather than hardcoding them.

## Local development

```bash
git clone https://github.com/tahadeab/Gym-Management-Web.git
cd Gym-Management-Web
pnpm install
pnpm check
pnpm test
pnpm dev
```

The development server prints the local URL when it starts. The default application entry is the dashboard. Authentication and protected queries require a configured session and database. On Windows PowerShell, use the same commands from the project directory; do not run `npm run web`, because that command belongs to the legacy Electron repository.

For the legacy desktop application, use [`tahadeab/GYM-management-system`](https://github.com/tahadeab/GYM-management-system), run `npm install`, and then `npm start`. For the full modern web dashboard, use this repository and run `pnpm dev`.

## Windows PowerShell troubleshooting

If `npm run web` opens a nearly empty page with a welcome message and one button, inspect the current folder with `Get-Location` and `Get-ChildItem`. You are probably inside the legacy `GYM-Management-System` Electron repository. That repository's `npm run web` command only serves its static inspection files on port 8080; it does not launch the modern React dashboard.

Use the following commands to launch the intended application:

```powershell
# Modern React Web/PWA dashboard
cd D:\path\to\Gym-Management-Web
pnpm install
pnpm dev

# Legacy Electron desktop application
cd D:\path\to\GYM-Management-System
npm install
npm start
```

The message `Python was not found; run without arguments to install from the Microsoft Store` means Windows could not find `python3`. The fallback `python -m http.server 8080` may still start through a Windows execution-alias or another available Python command, but it only serves the legacy static page. It is unrelated to the modern web server. Close the old server with `Ctrl+C`, switch to the modern web repository, and run `pnpm dev` instead.

## Production build

```bash
pnpm build
pnpm start
```

The build creates the Vite client bundle and bundles the Express/tRPC server. Use a managed secret store in production, enable database TLS where supported, and run a reviewed migration process before changing the schema.

## Database workflow

The database schema is defined in `drizzle/schema.ts`, query helpers live in `server/db.ts`, and tRPC procedures are defined in `server/routers.ts`. For a schema change, update the Drizzle schema, generate the migration, review the generated SQL, apply it through the controlled migration workflow, and then verify the affected queries and UI. Avoid destructive production SQL without a verified backup and rollback plan.

## Authentication and API

Browser authentication uses the OAuth callback and a secure session cookie. Protected procedures are guarded on the server; the client consumes them through the typed tRPC client under `/api/trpc`. The server also accepts a valid signed session token in `Authorization: Bearer <token>`, which is used by the companion mobile application. A mobile token must be issued by the approved authentication gateway and must be short-lived and rotated according to the gym's security policy.

## PWA installation and offline behavior

Serve the application over HTTPS, open it in a supported browser, and choose **Install app** or **Add to Home Screen**. The project exposes `/manifest.webmanifest` and `/sw.js`. The service worker protects the application shell for repeat visits but deliberately excludes `/api/` and tRPC responses from caching so that memberships, payments, attendance, bookings, and reports are not served from stale business data.

## Mobile companion

The separate project at `/home/ubuntu/gym-management-mobile` is an Expo/React Native application using the same backend. It includes dashboard, members, subscriptions, classes, personal training, attendance, and notification views. Notification rows are currently derived from active subscriptions approaching their end date; native push delivery is a separate deployment feature.

```bash
cd ../gym-management-mobile
npm install
EXPO_PUBLIC_API_URL=https://YOUR-GYM-DOMAIN npm start
```

The mobile connection panel stores the short-lived session token under `pulseforge-session-token` in AsyncStorage. For production, replace manual token entry with the organization's approved mobile OAuth or token-exchange flow and use secure device storage.

## Verification commands

Run the web checks from this repository:

```bash
pnpm check
pnpm test -- --run
```

Run the mobile TypeScript check:

```bash
cd ../gym-management-mobile
npx tsc --noEmit
```

The desktop Electron project has its own verification commands documented in its repository. A release should also include browser verification of login, language switching, member CRUD, subscription lifecycle actions, reports, bookings, attendance, and PWA installation metadata.

## Repository layout

```text
client/                 React pages, components, styles, and PWA entry files
drizzle/                Database schema and migration metadata
server/                 Database helpers, tRPC routers, authentication, and tests
shared/                 Shared constants and types
storage/                Storage helpers
todo.md                 Feature history and release verification record
```

## Engineering and security rules

All protected business procedures must remain behind authentication and administrative mutations must preserve server-side role checks. Keep file bytes in object storage rather than database columns. Do not cache API responses in the service worker. Validate all dates and numeric inputs at the API boundary. Before submitting a change, run the type check and test suite, update both language variants, and document any new environment variable.

## Arabic summary

PulseForge Gym Management هو نظام احترافي لإدارة الجيم مبني على React وTypeScript وtRPC وقاعدة بيانات MySQL/TiDB. يدعم إدارة الأعضاء والاشتراكات والمدفوعات والتقارير المالية وتصدير XLSX والحضور والمدربين والحصص والحجوزات والتدريب الشخصي من خلال لوحة تحكم متجاوبة.

يدعم النظام **اللغة الإنجليزية باتجاه LTR واللغة العربية باتجاه RTL** مع حفظ اختيار اللغة. كما يمكن تثبيت نسخة الويب كتطبيق PWA، ويوجد تطبيق Expo مستقل للموبايل يتصل بنفس الخادم باستخدام `EXPO_PUBLIC_API_URL` ورمز جلسة Bearer صالح.

## License

This project is distributed under the MIT License. See [`LICENSE`](./LICENSE).

## Maintainer

Maintained by **taha deab**.

## Desktop application from the Web build

The desktop application is now a thin Electron shell around this same `gym-management-web` application. It does not use the legacy Electron dashboard UI. Electron starts the production web server from `dist/index.js` on a local loopback port and opens that exact Web interface in a desktop window, preserving the Web dashboard, Arabic/English switching, RTL/LTR behavior, theme controls, route structure, and server-backed data flows.

Use `pnpm desktop:dev` to build the Web application and open it in Electron during development. Use `pnpm desktop:dir` to create an unpacked desktop build for local verification. On Windows, use `pnpm desktop:win` to generate `PulseForge-Gym-Management-Setup-<version>.exe` through electron-builder. The command disables implicit GitHub publishing; CI or a manual GitHub Release step should publish the resulting installer.

For a deployed Web backend, set `PULSEFORGE_WEB_URL` before launching Electron. Without that variable, Electron starts the bundled production Web server locally. Authentication remains the Web application's authentication flow; the desktop shell does not bypass or replace it.
