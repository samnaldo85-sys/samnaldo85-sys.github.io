import type { RangeKey } from '../types';

interface RangeSelectorProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}

const ranges: RangeKey[] = ['3M', '6M', '1Y', '2Y', '5Y'];

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-1">
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          className={[
            'min-w-11 rounded px-3 py-1.5 text-sm font-medium transition',
            value === range
              ? 'bg-white text-slate-950'
              : 'text-slate-400 hover:bg-white/8 hover:text-white',
          ].join(' ')}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
