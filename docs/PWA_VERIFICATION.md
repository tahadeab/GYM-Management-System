# PWA Verification

Verification performed against the development preview on 2026-08-15.

- `/manifest.webmanifest` returned valid JSON with `display: standalone`, `start_url: /`, `theme_color: #ff6b22`, portrait orientation, app shortcuts, and bilingual product metadata.
- `/sw.js` was reachable from the same origin and contained install, activate, cache, and fetch handlers.
- API requests containing `/api/` are explicitly excluded from Service Worker caching.
- A 390x844 browser capture confirmed that the web dashboard remains usable on a mobile viewport.

Installability still depends on serving the production build over HTTPS and the browser's own install criteria. The preview confirms the required manifest and Service Worker resources are available; it does not simulate tapping a platform-specific Add to Home Screen prompt.
