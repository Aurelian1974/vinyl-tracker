import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { SearchInput } from '@/components/ui/SearchInput';
import { useCollectionSearch } from '@/hooks/useCollectionSearch';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { CoverImage } from '@/components/ui/CoverImage';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import type { VinylRecord } from '@/db/types';

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const searchResults = useCollectionSearch(query);
  const allRecords    = useLiveQuery(() => db.records.toArray(), []) ?? [];

  const displayed = query.trim() ? searchResults : [];

  const getStatusBadge = (record: VinylRecord) => {
    if (record.status === 'wishlist')
      return <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full">🎯 Wishlist</span>;
    return <span className="text-xs bg-green-900/50 text-green-300 border border-green-700 px-2 py-0.5 rounded-full">✓ Owned</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">VinylTracker</h1>
        <p className="text-slate-400 text-sm">
          {allRecords.filter(r => r.status === 'owned').length} viniluri · {allRecords.filter(r => r.status === 'wishlist').length} wishlist
        </p>
      </div>

      <InstallPrompt />

      {/* Search */}
      <div className="px-4 mt-4">
        <SearchInput value={query} onChange={setQuery} autoFocus />
      </div>

      {/* Quick actions (shown when no search) */}
      {!query.trim() && (
        <div className="px-4 mt-6 grid grid-cols-2 gap-3">
          <QuickAction
            icon="➕"
            label="Adaugă rapid"
            desc="Completare manuală sau Discogs"
            onClick={() => navigate({ to: '/add', search: { q: undefined, barcode: undefined } })}
          />
          <QuickAction
            icon="📷"
            label="Scanează barcode"
            desc="EAN-13 / UPC-A"
            onClick={() => navigate({ to: '/scanner' })}
          />
        </div>
      )}

      {/* Search results */}
      {query.trim() && (
        <div className="px-4 mt-4 space-y-2 pb-24">
          {displayed.length === 0 && (
            <div className="space-y-3">
              <p className="text-slate-500 text-sm text-center py-4">Niciun rezultat în colecție</p>
              <button
                onClick={() => navigate({ to: '/add', search: { q: query, barcode: undefined } })}
                className="w-full bg-indigo-600/20 border border-indigo-700 text-indigo-300 py-4 rounded-xl font-medium text-sm min-h-[56px]"
              >
                ➕ Adaugă &ldquo;{query}&rdquo; în colecție
              </button>
            </div>
          )}
          {displayed.map(record => (
            <button
              key={record.id}
              type="button"
              onClick={() =>
                record.status === 'owned'
                  ? navigate({ to: '/collection/$id', params: { id: String(record.id) } })
                  : navigate({ to: '/wishlist' })
              }
              className="w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-600 transition-all min-h-[72px]"
            >
              <CoverImage
                recordId={record.id} coverUrl={record.coverUrl}
                alt={record.title} size="thumbnail"
                className="w-14 h-14 rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{record.artist}</p>
                <p className="text-slate-300 text-sm truncate">{record.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(record)}
                  <ConditionBadge condition={record.condition} />
                </div>
              </div>
            </button>
          ))}

          {displayed.length > 0 && (
            <button
              onClick={() => navigate({ to: '/add', search: { q: query, barcode: undefined } })}
              className="w-full border border-slate-700 text-slate-400 py-3 rounded-xl text-sm min-h-[48px] mt-2"
            >
              ➕ Non-l am, adaugă în colecție
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!query.trim() && allRecords.length === 0 && (
        <div className="text-center py-16 text-slate-500 px-4">
          <p className="text-5xl mb-4">💿</p>
          <p className="text-lg font-medium mb-2 text-slate-400">Începe colecția ta</p>
          <p className="text-sm">Adaugă primul vinil cu butonul de mai sus</p>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick }: {
  icon: string; label: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-slate-600 active:scale-[0.97] transition-all min-h-[80px]"
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-white text-sm font-semibold mt-2">{label}</p>
      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
    </button>
  );
}
