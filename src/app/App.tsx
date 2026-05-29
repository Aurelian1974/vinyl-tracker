import { useEffect, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { flushOfflineQueue } from '@/services/offlineQueue';
import { useSessionBudget } from '@/hooks/useSessionBudget';
import { useFileSystemSync } from '@/hooks/useFileSystemSync';
import { db } from '@/db/db';

export function BottomNav() {
  const routerState = useRouterState();
  const pathname    = routerState.location.pathname;
  const budget      = useSessionBudget();

  // Hide bottom nav on scanner (fullscreen camera) and detail pages
  if (pathname.startsWith('/scanner') || pathname.match(/^\/collection\/\d+/)) return null;

  const tabs = [
    { to: '/',          icon: '🔍', label: 'Caută' },
    { to: '/collection', icon: '💿', label: 'Colecție' },
    { to: '/add',       icon: '➕', label: 'Adaugă' },
    { to: '/wishlist',  icon: '🎯', label: 'Wishlist' },
    { to: '/statistics', icon: '📊', label: 'Stats' },
    { to: '/settings',  icon: '⚙️', label: 'Setări' },
  ];

  return (
    <>
      {/* Session budget strip */}
      {budget.active && (
        <div className={`fixed bottom-14 inset-x-0 z-40 flex items-center justify-between px-4 py-1.5 text-xs font-mono tabular-nums
          ${budget.overBudget
            ? 'bg-red-500/20 text-red-400 border-t border-red-500/30'
            : 'bg-white/5 text-white/50 border-t border-white/5'}`}>
          <span>Sesiune: {budget.spent.toFixed(0)} / {budget.limit} RON</span>
          <button
            onClick={budget.endSession}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            ✕ Închide
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-area-bottom">
        <div className="flex">
          {tabs.map(tab => {
            const active = pathname === tab.to || (tab.to !== '/' && pathname.startsWith(tab.to));
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex-1 flex flex-col items-center py-2 min-h-[56px] justify-center transition-colors ${
                  active ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-xs mt-1 leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function App() {
  const fsSync = useFileSystemSync();
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    // Request persistent storage on first load
    navigator.storage?.persist().then(granted => {
      if (!granted) console.warn('[VinylTracker] Storage eviction not prevented');
    });

    // Flush offline queue when online
    const handleOnline = () => { void flushOfflineQueue(); };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) void flushOfflineQueue();

    // Auto-restore din fișier dacă IndexedDB e gol + verifică permisiunea sync
    void (async () => {
      await fsSync.init();
      // Arată bannerul de reconectare dacă folderul e configurat dar permisiunea a expirat
      if (fsSync.dirName && fsSync.needsPermission) {
        setShowReconnect(true);
      }
      const count = await db.records.count();
      if (count === 0) {
        const result = await fsSync.restoreFromFile();
        if (result.restored && result.count > 0) {
          console.info(`[VinylTracker] Auto-restored ${result.count} records from local file`);
        }
      }
    })();

    return () => window.removeEventListener('online', handleOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizează bannerul când starea permisiunii se schimbă
  useEffect(() => {
    if (fsSync.dirName && fsSync.needsPermission) setShowReconnect(true);
    else setShowReconnect(false);
  }, [fsSync.dirName, fsSync.needsPermission]);

  const handleReconnect = async () => {
    await fsSync.reconnect();
    // După reconectare încearcă auto-restore dacă DB e gol
    const count = await db.records.count();
    if (count === 0) void fsSync.restoreFromFile();
  };

  return (
    <>
      {showReconnect && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-amber-600 text-white px-4 py-3 flex items-center justify-between gap-3 safe-area-top">
          <p className="text-sm font-medium">📁 Reconectează folderul sync: <span className="font-bold">{fsSync.dirName}</span></p>
          <button
            onClick={() => void handleReconnect()}
            className="shrink-0 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-bold active:bg-white/30"
          >
            Reconectează
          </button>
        </div>
      )}
    </>
  );
}
