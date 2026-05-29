import { useState, useCallback } from 'react';
import { db } from '@/db/db';
import { useAppStore } from '@/stores/useAppStore';

const FS_HANDLE_KEY = 'sync-dir';
const SYNC_FILENAME = 'vinyl-tracker-data.json';

export interface SyncData {
  version: number;
  savedAt: string;
  discogsToken: string | null;
  defaultCurrency: string;
  records: unknown[];
  playLogs: unknown[];
}

// File System Access API — nu e în lib.dom standard, cast explicit
type FSHandle = FileSystemDirectoryHandle & {
  queryPermission: (opts: { mode: string }) => Promise<string>;
  requestPermission: (opts: { mode: string }) => Promise<string>;
};

/** Verifică/cere permisiune pe un handle existent */
async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as FSHandle;
  try {
    if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
    if ((await h.requestPermission({ mode: 'readwrite' })) === 'granted') return true;
  } catch {
    // queryPermission nu e suportat pe toate browserele, continuăm oricum
    return true;
  }
  return false;
}

export function useFileSystemSync() {
  const [status, setStatus]         = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [message, setMessage]       = useState('');
  const [dirName, setDirName]       = useState<string | null>(null);
  const { defaultCurrency }         = useAppStore();

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  /** Returnează handle-ul stocat, dacă există și permisiunea e validă */
  const getStoredHandle = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    const entry = await db.fsHandles.get(FS_HANDLE_KEY);
    if (!entry) return null;
    const ok = await verifyPermission(entry.handle);
    if (!ok) return null;
    return entry.handle;
  }, []);

  /** Alege folder nou */
  const pickFolder = useCallback(async () => {
    if (!isSupported) { setMessage('Browser-ul nu suportă File System Access API'); return; }
    try {
      const handle = await (window as unknown as {
        showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle>
      }).showDirectoryPicker({ mode: 'readwrite' });
      await db.fsHandles.put({ key: FS_HANDLE_KEY, handle });
      setDirName(handle.name);
      setMessage(`Folder selectat: ${handle.name}`);
    } catch {
      // user cancelled
    }
  }, [isSupported]);

  /** Scrie JSON în fișierul de sync */
  const saveToFile = useCallback(async (): Promise<boolean> => {
    const handle = await getStoredHandle();
    if (!handle) return false;
    setStatus('busy');
    try {
      const [records, playLogs] = await Promise.all([
        db.records.toArray(),
        db.playLogs.toArray(),
      ]);
      const data: SyncData = {
        version:         1,
        savedAt:         new Date().toISOString(),
        discogsToken:    localStorage.getItem('discogs_token'),
        defaultCurrency,
        records,
        playLogs,
      };
      const fileHandle = await handle.getFileHandle(SYNC_FILENAME, { create: true });
      const writable   = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      setStatus('ok');
      setMessage(`Salvat: ${new Date().toLocaleTimeString('ro-RO')}`);
      return true;
    } catch (e) {
      console.error('[FSSync] save failed', e);
      setStatus('error');
      setMessage('Eroare la salvare');
      return false;
    }
  }, [getStoredHandle, defaultCurrency]);

  /** Citește JSON și restaurează în IndexedDB */
  const restoreFromFile = useCallback(async (): Promise<{ restored: boolean; count: number }> => {
    const handle = await getStoredHandle();
    if (!handle) return { restored: false, count: 0 };
    setStatus('busy');
    try {
      const fileHandle = await handle.getFileHandle(SYNC_FILENAME);
      const file       = await fileHandle.getFile();
      const text       = await file.text();
      const data: SyncData = JSON.parse(text) as SyncData;

      // Restore token
      if (data.discogsToken) localStorage.setItem('discogs_token', data.discogsToken);

      // Restore records (clear + re-add)
      await db.transaction('rw', [db.records, db.playLogs], async () => {
        await db.records.clear();
        await db.playLogs.clear();
        if (data.records?.length) await db.records.bulkAdd(data.records as Parameters<typeof db.records.bulkAdd>[0]);
        if (data.playLogs?.length) await db.playLogs.bulkAdd(data.playLogs as Parameters<typeof db.playLogs.bulkAdd>[0]);
      });

      const count = data.records?.length ?? 0;
      setStatus('ok');
      setMessage(`Restaurat: ${count} vinyluri`);
      return { restored: true, count };
    } catch (e) {
      console.error('[FSSync] restore failed', e);
      setStatus('error');
      setMessage('Eroare la restaurare');
      return { restored: false, count: 0 };
    }
  }, [getStoredHandle]);

  /** Inițializare la pornire: verifică dacă există handle și setează dirName */
  const init = useCallback(async () => {
    const entry = await db.fsHandles.get(FS_HANDLE_KEY);
    if (entry) setDirName(entry.handle.name);
  }, []);

  /** Șterge folderul de sync */
  const clearFolder = useCallback(async () => {
    await db.fsHandles.delete(FS_HANDLE_KEY);
    setDirName(null);
    setMessage('Sync dezactivat');
  }, []);

  return {
    isSupported,
    dirName,
    status,
    message,
    pickFolder,
    saveToFile,
    restoreFromFile,
    clearFolder,
    init,
  };
}
