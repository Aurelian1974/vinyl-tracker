import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { VinylRecord, Currency } from '@/db/types';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { CoverImage } from '@/components/ui/CoverImage';

export function WishlistView() {
  const navigate  = useNavigate();
  const [adding,  setAdding]  = useState(false);
  const [artist,  setArtist]  = useState('');
  const [title,   setTitle]   = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('RON');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);

  const wishlist = useLiveQuery(
    () => db.records.where('status').equals('wishlist').toArray(),
    []
  ) ?? [];

  const sorted = [...wishlist].sort((a, b) => (a.wishlistPriority ?? 2) - (b.wishlistPriority ?? 2));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) return;
    const record: VinylRecord = {
      artist:          artist.trim(),
      title:           title.trim(),
      format:          'LP',
      condition:       'VG+',
      currency,
      maxBuyPrice:     maxPrice ? parseFloat(maxPrice) : undefined,
      wishlistPriority: priority,
      status:          'wishlist',
      createdAt:       new Date(),
      updatedAt:       new Date(),
    };
    await db.records.add(record);
    navigator.vibrate?.(80);
    setArtist(''); setTitle(''); setMaxPrice(''); setAdding(false);
  };

  const handleRemove = async (id: number) => {
    await db.records.delete(id);
    navigator.vibrate?.(80);
  };

  const priorityLabel = (p?: 1 | 2 | 3) =>
    p === 1 ? '🔴 Must have' : p === 2 ? '🟡 Vreau' : '🟢 Poate';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: '/' })} className="p-2 -ml-2 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Wishlist 🎯</h1>
        <button
          onClick={() => setAdding(v => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[44px]"
        >
          + Adaugă
        </button>
      </header>

      {adding && (
        <form onSubmit={handleAdd} className="m-4 bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <input
            required type="text" value={artist} onChange={e => setArtist(e.target.value)}
            placeholder="Artist *"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            required type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Titlu *"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <input
              type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              placeholder="Preț maxim"
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={currency} onChange={e => setCurrency(e.target.value as Currency)}
              className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white outline-none"
            >
              <option value="RON">RON</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-lg border text-sm min-h-[44px] transition-colors ${
                  priority === p ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-600 text-slate-400'
                }`}>
                {priorityLabel(p)}
              </button>
            ))}
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl min-h-[48px]">
            Adaugă la wishlist
          </button>
        </form>
      )}

      <div className="px-4 space-y-2 pb-24 pt-2">
        {sorted.length === 0 && !adding && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-4">🎯</p>
            <p>Wishlist-ul tău e gol</p>
          </div>
        )}
        {sorted.map(record => (
          <div key={record.id}
            className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
            <CoverImage
              recordId={record.id} coverUrl={record.coverUrl}
              alt={record.title} size="thumbnail"
              className="w-14 h-14 rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{record.artist}</p>
              <p className="text-slate-300 text-sm truncate">{record.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">{priorityLabel(record.wishlistPriority)}</span>
                {record.maxBuyPrice && (
                  <span className="text-xs text-green-400">Max: {record.maxBuyPrice} {record.currency}</span>
                )}
                <ConditionBadge condition={record.condition} />
              </div>
            </div>
            <button
              onClick={() => record.id && handleRemove(record.id)}
              className="p-2 text-slate-500 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
