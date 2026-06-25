import type { AssetData, MarketPoint, RangeKey, Status } from '../types';

const rangeDays: Record<RangeKey, number> = {
  '3M': 92,
  '6M': 184,
  '1Y': 366,
  '2Y': 366 * 2,
  '5Y': 366 * 5,
};

export function formatPrice(value: number | null | undefined, unit: AssetData['unit']) {
  if (value == null || Number.isNaN(value)) return '-';
  const maximumFractionDigits = unit === 'index' ? 2 : 0;
  return value.toLocaleString('ko-KR', { maximumFractionDigits });
}

export function formatDisparity(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value.toFixed(2)}%`;
}

export function statusClassName(status: Status | null | undefined) {
  switch (status) {
    case '과열해소':
      return 'border-sky-400/40 bg-sky-400/12 text-sky-100';
    case '정상':
      return 'border-emerald-400/40 bg-emerald-400/12 text-emerald-100';
    case '경계':
      return 'border-amber-400/50 bg-amber-400/14 text-amber-100';
    case '과열':
      return 'border-rose-400/50 bg-rose-400/14 text-rose-100';
    default:
      return 'border-slate-500/40 bg-slate-500/10 text-slate-200';
  }
}

export function filterByRange(records: MarketPoint[], range: RangeKey) {
  const valid = records.filter((item) => item.ma50 != null && item.disparity != null);
  const latest = valid.at(-1);
  if (!latest) return [];

  const end = new Date(latest.date);
  const start = new Date(end);
  start.setDate(end.getDate() - rangeDays[range]);

  return valid.filter((item) => new Date(item.date) >= start);
}

export function getLatestValid(records: MarketPoint[]) {
  return [...records].reverse().find((item) => item.ma50 != null && item.disparity != null) ?? null;
}
