/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Workbox injects the precache manifest here at build time
precacheAndRoute(
  (self as unknown as { __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0] }).__WB_MANIFEST ?? []
);
cleanupOutdatedCaches();

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
registerRoute(
  ({ url }) => url.hostname === 'i.discogs.com',
  new CacheFirst({
    cacheName: 'discogs-images',
    plugins: [new ExpirationPlugin({ maxEntries: 500 })],
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

      // Fetch în batch-uri de 5 — respectă rate limit CDN
      for (let i = 0; i < toFetch.length; i += 5) {
        const batch = toFetch.slice(i, i + 5);
        await Promise.allSettled(batch.map(url => cache.add(url)));
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
