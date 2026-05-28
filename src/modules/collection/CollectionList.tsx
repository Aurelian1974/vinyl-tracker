import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { VinylCondition, RecordFormat } from '@/db/types';
import { SearchInput } from '@/components/ui/SearchInput';
import { VinylCard } from './VinylCard';
import { useCollectionSearch } from '@/hooks/useCollectionSearch';

type SortKey = 'artist' | 'year' | 'purchaseDate' | 'pricePaid';

export function CollectionList() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [sortBy,  setSortBy]  = useState<SortKey>('artist');
  const [filterCond,   setFilterCond]   = useState<VinylCondition | ''>('');
  const [filterFormat, setFilterFormat] = useState<RecordFormat | ''>('');
  const [showFilters,  setShowFilters]  = useState(false);

  const searchResults = useCollectionSearch(query);
  const allOwned      = useLiveQuery(
    () => db.records.where('status').equals('owned').toArray(),
    []
  ) ?? [];

  const duplicates = useLiveQuery(async () => {
    const all  = await db.records.where('status').equals('owned').toArray();
    const seen = new Map<string, number>();
    for (const r of all) {
      const key = `${r.artist.toLowerCase()}|${r.title.toLowerCase()}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.values()].some(v => v > 1);
  }, []);

  const base = query.trim() ? searchResults.filter(r => r.status === 'owned') : allOwned;

  const filtered = base
    .filter(r => !filterCond   || r.condition === filterCond)
    .filter(r => !filterFormat || r.format    === filterFormat)
    .sort((a, b) => {
      if (sortBy === 'artist')       return a.artist.localeCompare(b.artist);
      if (sortBy === 'year')         return (b.year ?? 0) - (a.year ?? 0);
      if (sortBy === 'purchaseDate') return new Date(b.purchaseDate ?? 0).getTime() - new Date(a.purchaseDate ?? 0).getTime();
      if (sortBy === 'pricePaid')    return (b.pricePaid ?? 0) - (a.pricePaid ?? 0);
      return 0;
    });

  return (
    <div className="space-y-3">
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Caută în colecție..." />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`p-3 rounded-xl border min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors
              ${showFilters ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['artist', 'year', 'purchaseDate', 'pricePaid'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                    ${sortBy === key ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                  {key === 'artist' ? 'A–Z' : key === 'year' ? 'An' : key === 'purchaseDate' ? 'Dată' : 'Preț'}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['', 'M', 'NM', 'VG+', 'VG', 'G+', 'G'] as (VinylCondition | '')[]).map(c => (
                <button
                  key={c || 'all'}
                  onClick={() => setFilterCond(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                    ${filterCond === c ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                  {c || 'Toate'}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['', 'LP', 'EP', '7"', '12"', 'CD', 'Cassette'] as (RecordFormat | '')[]).map(f => (
                <button
                  key={f || 'all-fmt'}
                  onClick={() => setFilterFormat(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                    ${filterFormat === f ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                  {f || 'Format'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">{filtered.length} viniluri</p>
          {duplicates && (
            <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-700 px-2 py-0.5 rounded-full">
              ⚠ Duplicate detectate
            </span>
          )}
        </div>
      </div>

      <div className="px-4 space-y-2 pb-24">
        {filtered.map(record => (
          <VinylCard
            key={record.id}
            record={record}
            onClick={() => navigate({ to: '/collection/$id', params: { id: String(record.id) } })}
          />
        ))}
        {!filtered.length && (
          <div className="text-center py-16 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
              <circle cx="12" cy="12" r="3"  strokeWidth={1.5} />
            </svg>
            <p>{query ? 'Niciun rezultat' : 'Colecția ta e goală'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
