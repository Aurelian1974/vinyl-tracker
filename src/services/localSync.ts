/**
 * localSync — serviciu standalone pentru sync automat cu fișier local.
 * Nu e un React hook, poate fi apelat din orice loc după o mutație DB.
 */

import { db } from '@/db/db';
import { useAppStore } from '@/stores/useAppStore';

const FS_HANDLE_KEY  = 'sync-dir';
const SYNC_FILENAME  = 'vinyl-tracker-data.json';

type FSHandle = FileSystemDirectoryHandle & {
  queryPermission: (opts: { mode: string }) => Promise<PermissionState>;
};

async function hasPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const state = await (handle as FSHandle).queryPermission({ mode: 'readwrite' });
    return state === 'granted';
  } catch {
    // queryPermission ne-suportat — presupunem că avem permisiune
    return true;
  }
}

/**
 * Salvează automat colecția în fișierul de sync.
 * Silențios dacă nu există folder configurat sau permisiunea a expirat.
 */
export async function autoSave(): Promise<void> {
  try {
    if (!('showDirectoryPicker' in window)) return;

    const entry = await db.fsHandles.get(FS_HANDLE_KEY);
    if (!entry) return;

    const ok = await hasPermission(entry.handle);
    if (!ok) {
      console.info('[LocalSync] Permission not granted, skipping auto-save');
      return;
    }

    const [records, playLogs] = await Promise.all([
      db.records.toArray(),
      db.playLogs.toArray(),
    ]);

    const data = {
      version:         1,
      savedAt:         new Date().toISOString(),
      discogsToken:    localStorage.getItem('discogs_token'),
      defaultCurrency: useAppStore.getState().defaultCurrency,
      records,
      playLogs,
    };

    const fileHandle = await entry.handle.getFileHandle(SYNC_FILENAME, { create: true });
    const writable   = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    console.info(`[LocalSync] Auto-saved ${records.length} records`);
  } catch (e) {
    console.warn('[LocalSync] Auto-save failed', e);
  }
}
