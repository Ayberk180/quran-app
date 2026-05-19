// PWA service worker. Caches the app shell + manifest assets for offline use.
// TODO (Phase 2): implement install/activate/fetch handlers.
// Strategy:
//   - On install: pre-cache the app shell (HTML, JS, CSS, lessons.json).
//   - On fetch for /images/phrases/* and /audio/phrases/*: cache-first with
//     network fallback. These never change for a given build, so it's safe to
//     cache them indefinitely (busted by a new build hash).
//   - On fetch for everything else: stale-while-revalidate.
// See PROJECT_BRIEF.md §7 Phase 2.

const CACHE_NAME = 'quran-app-v1';

self.addEventListener('install', (event) => {
  // self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // TODO
});
