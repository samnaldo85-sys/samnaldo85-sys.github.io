import type { AssetData, AssetKey } from '../types';

interface AssetTabsProps {
  assets: Record<AssetKey, AssetData>;
  selected: AssetKey;
  onSelect: (key: AssetKey) => void;
}

const order: AssetKey[] = ['kospi', 'samsung', 'skhynix'];

export function AssetTabs({ assets, selected, onSelect }: AssetTabsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 sm:grid-cols-3">
      {order.map((key) => {
        const asset = assets[key];
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={[
              'rounded-md px-4 py-3 text-left transition',
              active
                ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30'
                : 'bg-transparent text-slate-300 hover:bg-white/8 hover:text-white',
            ].join(' ')}
          >
            <span className="block text-base font-semibold">{asset.name}</span>
            <span className={active ? 'text-sm text-slate-700' : 'text-sm text-slate-500'}>
              {asset.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
