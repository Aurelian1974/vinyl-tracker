import Dexie, { type Table } from 'dexie';
import type { VinylRecord, CoverImage, OfflineQueueItem, PlayLog } from './types';

export interface FsHandleEntry {
  key: string;
  handle: FileSystemDirectoryHandle;
}

export class VinylDB extends Dexie {
  records!:      Table<VinylRecord>;
  coverImages!:  Table<CoverImage>;
  offlineQueue!: Table<OfflineQueueItem>;
  playLogs!:     Table<PlayLog>;
  fsHandles!:    Table<FsHandleEntry>;

  constructor() {
    super('VinylTracker');

    this.version(1).stores({
      records:      '++id, barcode, discogsId, artist, status, purchaseDate, *genres, *styles',
      coverImages:  '++id, recordId',
      offlineQueue: '++id, type, createdAt',
    });

    // v2: collector fields + sell tracking + playLogs table
    this.version(2).stores({
      records:      '++id, barcode, discogsId, artist, status, purchaseDate, *genres, *styles, purchaseLocation, lastPlayedAt',
      coverImages:  '++id, recordId',
      offlineQueue: '++id, type, createdAt',
      playLogs:     '++id, recordId, playedAt',
    }).upgrade(tx =>
      tx.table('records').toCollection().modify((r: VinylRecord) => {
        if (r.playCount     === undefined) r.playCount     = 0;
        if (r.pressingNotes === undefined) r.pressingNotes = undefined;
      })
    );

    // v3: photoType index on coverImages
    this.version(3).stores({
      records:      '++id, barcode, discogsId, artist, status, purchaseDate, *genres, *styles, purchaseLocation, lastPlayedAt',
      coverImages:  '++id, recordId, photoType',
      offlineQueue: '++id, type, createdAt',
      playLogs:     '++id, recordId, playedAt',
    }).upgrade(tx =>
      tx.table('coverImages').toCollection().modify((img: CoverImage) => {
        if (!img.photoType) img.photoType = 'cover-front';
      })
    );

    // v4: fsHandles table for File System Access API sync
    this.version(4).stores({
      records:      '++id, barcode, discogsId, artist, status, purchaseDate, *genres, *styles, purchaseLocation, lastPlayedAt',
      coverImages:  '++id, recordId, photoType',
      offlineQueue: '++id, type, createdAt',
      playLogs:     '++id, recordId, playedAt',
      fsHandles:    'key',
    });
  }
}

export const db = new VinylDB();
