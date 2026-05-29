import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { precacheDiscogCovers, isCoverCached, onCoversCached } from '@/services/coverCache';

export function useDiscogCovers() {
  const [isCaching, setIsCaching] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);

  // Toate URL-urile din colecție
  const allCoverUrls = useLiveQuery(
    () => db.records
      .where('status').equals('owned')
      .toArray()
      .then(recs => recs.map(r => r.coverUrl).filter((u): u is string => Boolean(u))),
    []
  );

  // Ascultă confirmarea SW
  useEffect(() => {
    return onCoversCached(count => {
      setCachedCount(prev => prev + count);
      setIsCaching(false);
    });
  }, []);

  // Declanșează pre-cache pentru întreaga colecție
  const cacheAllCovers = useCallback(async () => {
    if (!allCoverUrls?.length) return;
    setIsCaching(true);
    await precacheDiscogCovers(allCoverUrls);
    // timeout safety — dacă SW nu confirmă în 30s
    setTimeout(() => setIsCaching(false), 30_000);
  }, [allCoverUrls]);

  return {
    totalCovers: allCoverUrls?.length ?? 0,
    isCaching,
    cachedCount,
    cacheAllCovers,
  };
}

/**
 * Verifică la nivel de record individual dacă coperta e cached.
 * Folosit în VinylCard pentru badge offline indicator.
 */
export function useCoverCacheStatus(coverUrl: string | undefined) {
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (!coverUrl) return;
    void isCoverCached(coverUrl).then(setIsCached);
  }, [coverUrl]);

  return isCached;
}
