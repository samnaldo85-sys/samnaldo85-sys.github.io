import { Activity, Gauge, LineChart, Wallet } from 'lucide-react';
import type { AssetData, MarketPoint } from '../types';
import { formatDisparity, formatPrice, statusClassName } from '../utils/format';

interface SummaryCardsProps {
  asset: AssetData;
  latest: MarketPoint | null;
}

export function SummaryCards({ asset, latest }: SummaryCardsProps) {
  const cards = [
    {
      label: '최근 종가',
      value: latest ? formatPrice(latest.close, asset.unit) : '-',
      icon: Wallet,
    },
    {
      label: '50일 이동평균',
      value: latest ? formatPrice(latest.ma50, asset.unit) : '-',
      icon: LineChart,
    },
    {
      label: '50일 이격도',
      value: latest ? formatDisparity(latest.disparity) : '-',
      icon: Gauge,
    },
    {
      label: '현재 구간',
      value: latest?.status ?? '-',
      icon: Activity,
      status: latest?.status,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-lg border border-white/10 bg-panel/88 p-5 shadow-glow">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-400">{card.label}</p>
              <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            </div>
            <div
              className={
                card.status
                  ? `mt-4 inline-flex rounded-md border px-3 py-1.5 text-xl font-semibold ${statusClassName(card.status)}`
                  : 'mt-4 text-2xl font-semibold text-white'
              }
            >
              {card.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}
