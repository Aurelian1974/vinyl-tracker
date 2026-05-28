import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

const FUSE_OPTIONS = {
  keys:               ['artist', 'title', 'label', 'catalogNumber'],
  threshold:          0.35,
  includeScore:       true,
  minMatchCharLength: 2,
};

export function useCollectionSearch(query: string) {
  const records = useLiveQuery(() => db.records.toArray(), []);

  return useMemo(() => {
    if (!records || !query.trim()) return records ?? [];
    const fuse = new Fuse(records, FUSE_OPTIONS);
    return fuse.search(query).map(r => r.item);
  }, [records, query]);
}
