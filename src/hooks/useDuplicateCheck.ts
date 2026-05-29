import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { VinylRecord } from '@/db/types';

export type DuplicateMatch = {
  type:   'exact-barcode' | 'fuzzy-title' | 'wishlist';
  record: VinylRecord;
  score:  number;   // 0 = identic, 1 = complet diferit
};

export function useDuplicateCheck(artist: string, title: string, barcode?: string) {
  const owned = useLiveQuery(
    () => db.records.toArray(),
    []
  );

  return useMemo((): DuplicateMatch[] => {
    if (!owned || (!artist.trim() && !title.trim() && !barcode)) return [];

    // 1. Match exact pe barcode
    if (barcode) {
      const exact = owned.find(r => r.barcode === barcode);
      if (exact) return [{ type: 'exact-barcode', record: exact, score: 0 }];
    }

    if (!artist.trim() && !title.trim()) return [];

    // 2. Fuzzy match pe artist + titlu — prinde "Led Zepelin IV" → "Led Zeppelin IV"
    const fuse = new Fuse(owned, {
      keys: [
        { name: 'artist', weight: 0.6 },
        { name: 'title',  weight: 0.4 },
      ],
      threshold:         0.30,
      includeScore:      true,
      useExtendedSearch: false,
    });

    const query = [artist.trim(), title.trim()].filter(Boolean).join(' ');
    const results = fuse.search(query);

    return results.slice(0, 3).map(({ item, score }) => ({
      type:   item.status === 'wishlist' ? 'wishlist' : 'fuzzy-title',
      record: item,
      score:  score ?? 1,
    }));
  }, [owned, artist, title, barcode]);
}
