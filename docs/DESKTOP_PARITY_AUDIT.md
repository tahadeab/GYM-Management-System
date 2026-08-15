# Desktop Parity Audit

## Purpose

This document records the functional parity status of the Electron desktop application against the modern bilingual web/PWA system. It is intentionally explicit about partial areas so release decisions are based on verified behavior rather than visual similarity alone.

## Status matrix

| Domain | Electron status | Verified scope | Remaining work |
|---|---|---|---|
| Members | Supported | CRUD, search, filtering, contact and emergency fields, ownership controls | Add parity-level bulk import/export UX |
| Subscriptions | Supported | Monthly lifecycle, renewal, freeze/unfreeze, expiry indicators, notifications | Add richer plan catalogue and proration rules |
| Payments | Supported | Payment records, methods, revenue indicators, ownership checks, exports | Add refund/void workflow |
| Attendance | Supported | Check-in/check-out, activity type, notes, latest visits | Add configurable attendance devices/integrations |
| Trainers | Supported | Profiles, specialties, active state, relationships | Add availability calendar UI |
| Rooms | Partial | Electron now has a rooms table, CRUD service, class room_id linkage, room_name joins, and backup coverage | Add a dedicated room management screen and schedule conflict checks |
| Classes | Partial | Class CRUD, trainer assignment, capacity, pricing, booking foundation | Add room assignment, recurrence, waitlist, and calendar view |
| Personal training | Partial | Database and web support PT packages, assignments, sessions, and completion; Electron has no complete dedicated PT workflow | Add PT package/assignment/session screens and IPC services |
| Reports | Partial | Dashboard KPIs, revenue/attendance trends, expiry indicators, export foundation | Add full report filters and parity-level Excel export screens |
| Settings/RBAC | Supported | Admin/staff roles, controlled preload bridge, local settings, language persistence | Add settings sections matching web navigation |
| Bilingual UX | Supported for core shell | Arabic RTL and English LTR switching, persisted language, bilingual loading and dashboard collection states | Extend explicit state copy and validation to every non-dashboard workflow |
| Theme/visual system | Partial | PulseForge dashboard shell, semantic color tokens, dark-mode assets, loading overlay | Apply the same tokenized shell to legacy/secondary pages and remove placeholder content |

## Release interpretation

The desktop application is suitable for source-based operational testing and for generating an unpacked Electron package. It is not yet a claim of complete feature parity with the web application because rooms, the full PT workflow, and several advanced report/scheduling screens remain partial. The Windows NSIS target is configured; final installer generation should run on Windows or a CI runner with a compatible signing and packaging environment.

## Verification commands

```bash
npm run check
npm test
npm run build
npm run dist:win
```

The current automated desktop suite passes **56 tests**. The dashboard state tests cover the bilingual state contract; browser-level DOM testing for all secondary screens remains a follow-up once those screens are migrated to the shared desktop shell.
