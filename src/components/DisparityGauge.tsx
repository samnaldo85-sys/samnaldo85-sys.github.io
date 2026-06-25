import type { MarketPoint } from '../types';
import { formatDisparity, statusClassName } from '../utils/format';

interface DisparityGaugeProps {
  latest: MarketPoint | null;
}

const min = 80;
const max = 145;

function clamp(value: number) {
  return Math.min(max, Math.max(min, value));
}

function percent(value: number) {
  return ((value - min) / (max - min)) * 100;
}

export function DisparityGauge({ latest }: DisparityGaugeProps) {
  const disparity = latest?.disparity ?? null;
  const marker = disparity == null ? null : percent(clamp(disparity));

  return (
    <section className="rounded-lg border border-white/10 bg-panel/88 p-5 shadow-glow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">이격도 게이지</h2>
          <p className="mt-1 text-sm text-slate-400">105 · 120 · 130 기준선으로 현재 위치를 봅니다.</p>
        </div>
        <span className={`w-fit rounded-md border px-3 py-1.5 text-sm font-semibold ${statusClassName(latest?.status)}`}>
          {latest?.status ?? '데이터 준비 중'} {formatDisparity(disparity)}
        </span>
      </div>

      <div className="mt-8">
        <div className="relative h-4 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500">
          {[105, 120, 130].map((value) => (
            <div
              key={value}
              className="absolute top-1/2 h-8 w-px -translate-y-1/2 bg-white/80"
              style={{ left: `${percent(value)}%` }}
            />
          ))}
          {marker != null && (
            <div
              className="absolute top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-slate-950 shadow-lg"
              style={{ left: `${marker}%` }}
              aria-label={`현재 이격도 ${formatDisparity(disparity)}`}
            />
          )}
        </div>
        <div className="relative mt-4 h-10 text-xs text-slate-300">
          <span className="absolute -translate-x-1/2" style={{ left: `${percent(105)}%` }}>
            105
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${percent(120)}%` }}>
            120
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${percent(130)}%` }}>
            130
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
          <span className="rounded border border-sky-300/25 bg-sky-300/10 px-2 py-2">과열해소 ≤105</span>
          <span className="rounded border border-emerald-300/25 bg-emerald-300/10 px-2 py-2">정상 105~120</span>
          <span className="rounded border border-amber-300/25 bg-amber-300/10 px-2 py-2">경계 120~130</span>
          <span className="rounded border border-rose-300/25 bg-rose-300/10 px-2 py-2">과열 ≥130</span>
        </div>
      </div>
    </section>
  );
}
