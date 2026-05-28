import type { VinylRecord } from '@/db/types';
import { CoverImage } from '@/components/ui/CoverImage';
import { ConditionBadge } from '@/components/ui/ConditionBadge';

interface VinylCardProps {
  record:   VinylRecord;
  onClick?: () => void;
}

export function VinylCard({ record, onClick }: VinylCardProps) {
  const statusIcon = record.status === 'wishlist' ? '🎯' : '✓';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-3 text-left hover:border-slate-600 active:scale-[0.98] transition-all min-h-[72px]"
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
  );
}
