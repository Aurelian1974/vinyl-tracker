/**
 * Trimite URL-urile copertelor la Service Worker pentru pre-cache offline.
 * SW-ul face fetch în background — pagina nu e blocată.
 * Funcționează doar când SW-ul este activ (după prima instalare PWA).
 */
export async function precacheDiscogCovers(coverUrls: string[]): Promise<void> {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return; // SW nu e activ — skip silențios

  const urls = coverUrls.filter(Boolean);
  if (urls.length === 0) return;

  sw.postMessage({ type: 'CACHE_COVERS', urls });
}

/**
 * Verifică dacă o copertă Discogs e disponibilă offline (în Cache Storage).
 */
export async function isCoverCached(coverUrl: string): Promise<boolean> {
  if (!coverUrl) return false;
  try {
    const cache = await caches.open('discogs-images');
    return !!(await cache.match(coverUrl));
  } catch {
    return false;
  }
}

/**
 * Ascultă confirmarea de la SW că batch-ul de cache s-a terminat.
 */
export function onCoversCached(callback: (count: number) => void): () => void {
  const handler = (event: MessageEvent) => {
    if ((event.data as { type?: string })?.type === 'COVERS_CACHED') {
      callback((event.data as { count: number }).count);
    }
  };
  navigator.serviceWorker?.addEventListener('message', handler);
  return () => navigator.serviceWorker?.removeEventListener('message', handler);
}
