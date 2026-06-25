import type { MarketPoint, Status } from '../types';

export function getStatus(disparity: number): Status {
  if (disparity <= 105) return '과열해소';
  if (disparity < 120) return '정상';
  if (disparity < 130) return '경계';
  return '과열';
}

export function calculateIndicators(
  rows: Array<{ date: string; close: number }>,
  windowSize = 50,
): MarketPoint[] {
  return rows.map((row, index) => {
    if (index < windowSize - 1) {
      return { ...row, ma50: null, disparity: null, status: null };
    }

    const slice = rows.slice(index - windowSize + 1, index + 1);
    const ma50 = slice.reduce((sum, item) => sum + item.close, 0) / windowSize;
    const disparity = Number(((row.close / ma50) * 100).toFixed(2));

    return {
      ...row,
      ma50: Number(ma50.toFixed(2)),
      disparity,
      status: getStatus(disparity),
    };
  });
}
