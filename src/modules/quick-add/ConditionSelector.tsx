import type { VinylCondition } from '@/db/types';
import { ALL_CONDITIONS, VINYL_CONDITIONS } from '@/utils/vinylGrading';

interface ConditionSelectorProps {
  value:    VinylCondition;
  onChange: (v: VinylCondition) => void;
  label?:   string;
}

const colorMap: Record<string, string> = {
  emerald: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
  green:   'border-green-500 bg-green-500/20 text-green-300',
  lime:    'border-lime-500 bg-lime-500/20 text-lime-300',
  yellow:  'border-yellow-500 bg-yellow-500/20 text-yellow-300',
  orange:  'border-orange-500 bg-orange-500/20 text-orange-300',
  red:     'border-red-500 bg-red-500/20 text-red-300',
  gray:    'border-gray-500 bg-gray-500/20 text-gray-300',
};

export function ConditionSelector({ value, onChange, label = 'Condiție disc' }: ConditionSelectorProps) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {ALL_CONDITIONS.map(cond => {
          const info     = VINYL_CONDITIONS[cond];
          const selected = cond === value;
          const colors   = colorMap[info.color] ?? colorMap.gray;
          return (
            <button
              key={cond}
              type="button"
              onClick={() => onChange(cond)}
              className={`
                py-2.5 rounded-lg border text-sm font-bold min-h-[44px] transition-all
                ${selected ? colors : 'border-slate-700 bg-slate-800 text-slate-400'}
              `}
              title={info.description}
            >
              {cond}
            </button>
          );
        })}
      </div>
      {value && (
        <p className="mt-1.5 text-xs text-slate-500">{VINYL_CONDITIONS[value].description}</p>
      )}
    </div>
  );
}
