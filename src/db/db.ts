import Dexie, { type Table } from 'dexie';
import type { VinylRecord, CoverImage, OfflineQueueItem } from './types';

export class VinylDB extends Dexie {
  records!:      Table<VinylRecord>;
  coverImages!:  Table<CoverImage>;
  offlineQueue!: Table<OfflineQueueItem>;

  constructor() {
    super('VinylTracker');
    this.version(1).stores({
      records:      '++id, barcode, discogsId, artist, status, purchaseDate, *genres, *styles',
      coverImages:  '++id, recordId',
      offlineQueue: '++id, type, createdAt',
    });
  }
}

export const db = new VinylDB();
