import { useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

export function useCoverImage(
  recordId: number | undefined,
  size: 'thumbnail' | 'full' = 'thumbnail'
) {
  const cover = useLiveQuery(
    () => recordId != null
      ? db.coverImages.where('recordId').equals(recordId).first()
      : undefined,
    [recordId]
  );

  const objectUrl = useMemo(() => {
    if (!cover) return null;
    const blob = size === 'thumbnail' ? cover.thumbnail : cover.full;
    return URL.createObjectURL(blob);
  }, [cover, size]);

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [objectUrl]);

  return objectUrl;
}
