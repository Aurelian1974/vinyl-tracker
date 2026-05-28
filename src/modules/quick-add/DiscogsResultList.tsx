import type { DiscogsSearchResult } from '@/services/discogs';

interface DiscogsResultListProps {
  results:   DiscogsSearchResult[];
  onSelect:  (r: DiscogsSearchResult) => void;
  isLoading: boolean;
}

export function DiscogsResultList({ results, onSelect, isLoading }: DiscogsResultListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Căutare Discogs...
      </div>
    );
  }

  if (!results.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
        {results.length} rezultate Discogs
      </p>
      {results.map(r => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r)}
          className="w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-indigo-500 transition-colors min-h-[60px]"
        >
          {r.cover_image && (
            <img
              src={r.cover_image}
              alt={r.title}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{r.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {[r.year, r.label?.[0], r.country].filter(Boolean).join(' · ')}
            </p>
            {r.format && (
              <p className="text-slate-500 text-xs">{r.format.join(', ')}</p>
            )}
          </div>
          <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}
