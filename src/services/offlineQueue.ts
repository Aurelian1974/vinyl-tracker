import { db } from '@/db/db';
import { searchDiscogs } from './discogs';

export async function queueBarcode(barcode: string) {
  await db.offlineQueue.add({
    type:      'discogs-barcode',
    payload:   barcode,
    createdAt: new Date(),
    retries:   0,
  });
}

export async function flushOfflineQueue() {
  const items = await db.offlineQueue.toArray();
  for (const item of items) {
    try {
      if (item.type === 'discogs-barcode') {
        await searchDiscogs({ barcode: item.payload });
      }
      await db.offlineQueue.delete(item.id!);
    } catch {
      await db.offlineQueue.update(item.id!, { retries: item.retries + 1 });
    }
  }
}
