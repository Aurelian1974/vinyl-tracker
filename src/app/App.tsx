import { useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { flushOfflineQueue } from '@/services/offlineQueue';

export function BottomNav() {
  const routerState = useRouterState();
  const pathname    = routerState.location.pathname;

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
  );
}

export function App() {
  useEffect(() => {
    // Request persistent storage on first load
    navigator.storage?.persist().then(granted => {
      if (!granted) console.warn('[VinylTracker] Storage eviction not prevented');
    });

    // Flush offline queue when online
    const handleOnline = () => { void flushOfflineQueue(); };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) void flushOfflineQueue();
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null; // Router renders the actual pages
}
