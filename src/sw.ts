/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Preia controlul imediat (nu mai așteaptă închiderea tab-urilor)
self.addEventListener('install', () => {
  void self.skipWaiting();
});
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// Workbox injects the precache manifest here at build time
precacheAndRoute(
  (self as unknown as { __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0] }).__WB_MANIFEST ?? []
);
cleanupOutdatedCaches();

// SPA navigation fallback: orice navigare (refresh, link direct) servește index.html din precache
// Fără asta, SW-ul lasă navigările spre server → GitHub Pages returnează 404
registerRoute(new NavigationRoute(createHandlerBoundToURL('/vinyl-tracker/index.html')));

// Runtime: Discogs API — NetworkFirst (5s timeout, cached 24h)
registerRoute(
  ({ url }) => url.hostname === 'api.discogs.com',
  new NetworkFirst({
    cacheName: 'discogs-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 })],
  })
);

// Runtime: Discogs images — CacheFirst (max 500 entries)
// Doar status 200 (CORS) — status 0 (opaque/no-cors) cauzează padding de ~7 MB/imagine în estimate
registerRoute(
  ({ url }) => url.hostname === 'i.discogs.com' || url.hostname === 'st.discogs.com',
  new CacheFirst({
    cacheName: 'discogs-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ─── CACHE_COVERS — pre-cache batch coperte Discogs ──────────────────────────
// Pagina trimite mesajul CACHE_COVERS cu lista de URL-uri i.discogs.com.
// SW-ul face fetch în background fără să blocheze pagina.
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type !== 'CACHE_COVERS') return;

  const urls: string[] = ((event.data as { urls?: unknown }).urls as string[] ?? [])
    .filter((url): url is string => typeof url === 'string' && url.startsWith('https://i.discogs.com/'));

  if (urls.length === 0) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open('discogs-images');

      // Verifică care nu sunt deja cached
      const missing = await Promise.all(
        urls.map(async url => ((await cache.match(url)) ? null : url))
      );
      const toFetch = missing.filter((u): u is string => u !== null);

      // Fetch în batch-uri de 5 — mode: cors pentru a evita opaque padding (~7 MB/imagine)
      for (let i = 0; i < toFetch.length; i += 5) {
        const batch = toFetch.slice(i, i + 5);
        await Promise.allSettled(
          batch.map(async url => {
            try {
              const resp = await fetch(url, { mode: 'cors' });
              if (resp.ok) await cache.put(url, resp);
            } catch {
              // CORS not supported by CDN — skip caching for this image
            }
          })
        );
        if (i + 5 < toFetch.length) {
          await new Promise<void>(r => setTimeout(r, 300));
        }
      }

      // Notifică pagina că s-a terminat
      const clients = await self.clients.matchAll();
      clients.forEach(client =>
        client.postMessage({ type: 'COVERS_CACHED', count: toFetch.length })
      );
    })()
  );
});
