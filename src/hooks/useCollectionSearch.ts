import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

const FUSE_OPTIONS = {
  keys:               [
    { name: 'artist',        weight: 1.0 },
    { name: 'title',         weight: 1.0 },
    { name: 'label',         weight: 0.7 },
    { name: 'catalogNumber', weight: 0.7 },
    { name: 'notes',         weight: 0.6 },
    { name: 'pressingNotes', weight: 0.5 },
    { name: 'genres',        weight: 0.5 },
    { name: 'styles',        weight: 0.4 },
  ],
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
