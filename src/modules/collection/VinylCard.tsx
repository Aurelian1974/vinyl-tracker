import { useState } from 'react';
import type { VinylRecord } from '@/db/types';
import { CoverImage } from '@/components/ui/CoverImage';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { getGenreColor } from '@/utils/genreColors';
import { useSwipeActions } from '@/hooks/useSwipeActions';

interface VinylCardProps {
  record:    VinylRecord;
  onClick?:  () => void;
  onDelete?: (id: number) => void;
}

export function VinylCard({ record, onClick, onDelete }: VinylCardProps) {
  const statusIcon  = record.status === 'wishlist' ? '🎯' : '✓';
  const borderColor = getGenreColor(record.genres);
  const [swiped, setSwiped] = useState(false);

  const swipe = useSwipeActions({
    onSwipeLeft:  () => setSwiped(true),
    onSwipeRight: () => setSwiped(false),
  });

  return (
    <div className="relative overflow-hidden rounded-xl" {...swipe}>
      {/* Action buttons revealed by swipe-left */}
      {swiped && (
        <div className="absolute inset-y-0 right-0 flex z-10">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setSwiped(false); }}
            className="bg-slate-700 text-slate-300 px-4 text-sm"
          >
            ✕
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete(record.id!); }}
              className="bg-red-600 text-white px-4 text-sm font-medium"
            >
              Șterge
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-600 active:scale-[0.98] transition-all min-h-[72px] border-l-4 ${borderColor}
          ${swiped ? '-translate-x-24' : 'translate-x-0'} transition-transform duration-200`}
      >
      <CoverImage
        recordId={record.id}
        coverUrl={record.coverUrl}
        alt={`${record.artist} – ${record.title}`}
        size="thumbnail"
        className="w-14 h-14 rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{record.artist}</p>
        <p className="text-slate-300 text-sm truncate">{record.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <ConditionBadge condition={record.condition} />
          {record.year && <span className="text-slate-500 text-xs">{record.year}</span>}
          {record.pricePaid && (
            <span className="text-slate-500 text-xs">{record.pricePaid} {record.currency}</span>
          )}
        </div>
      </div>
      <span className="text-lg flex-shrink-0">{statusIcon}</span>
      </button>
    </div>
  );
}
