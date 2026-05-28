import type { VinylCondition } from '@/db/types';
import { VINYL_CONDITIONS } from '@/utils/vinylGrading';

interface ConditionBadgeProps {
  condition: VinylCondition;
  size?:     'sm' | 'md';
}

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  green:   'bg-green-500/20 text-green-400 border-green-500/30',
  lime:    'bg-lime-500/20 text-lime-400 border-lime-500/30',
  yellow:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  orange:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  red:     'bg-red-500/20 text-red-400 border-red-500/30',
  gray:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function ConditionBadge({ condition, size = 'sm' }: ConditionBadgeProps) {
  const info   = VINYL_CONDITIONS[condition];
  const colors = colorMap[info.color] ?? colorMap.gray;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${colors} ${sizeClass}`}>
      {condition}
    </span>
  );
}
