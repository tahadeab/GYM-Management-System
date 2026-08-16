# Production Operations and Security Review

This review covers the Web-to-Desktop conversion and the existing PulseForge Web authentication boundary. The Electron wrapper does not introduce a second authorization system: protected operations remain behind the Web application's authenticated tRPC procedures and configured owner/admin controls.

## Multi-branch readiness

Before production use across multiple branches, each branch should have an explicit tenant or branch identifier on members, subscriptions, payments, attendance, classes, bookings, trainers, rooms, and reports. Authorization procedures must scope every read and mutation to the authenticated user's permitted branches. The current conversion does not claim to implement that tenant boundary; it keeps the existing Web data model and authentication behavior unchanged.

## Audit logging requirement

Sensitive operations should be recorded before multi-branch production: member creation/update/deletion, subscription lifecycle changes, payments, attendance corrections, class booking/cancellation, trainer and room scheduling changes, exports, and administrator role changes. A production implementation should record actor, branch, action, entity, entity identifier, timestamp, request correlation identifier, and outcome. The current Electron wrapper does not silently invent audit records; this remains an explicit hardening item for the deployment team.

## Credentials and release permissions

Do not commit tokens or secrets. GitHub workflow permissions are only needed to modify the workflow file; the existing Windows workflow and `v1.0.1` Release were already verified. The Web app still requires its configured production environment variables and an authenticated account for protected workflows.
