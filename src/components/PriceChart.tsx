import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AssetData, MarketPoint, RangeKey } from '../types';
import { formatPrice } from '../utils/format';
import { RangeSelector } from './RangeSelector';

interface PriceChartProps {
  asset: AssetData;
  data: MarketPoint[];
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}

export function PriceChart({ asset, data, range, onRangeChange }: PriceChartProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/88 p-4 shadow-glow sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">가격 & 50일 이동평균</h2>
        <RangeSelector value={range} onChange={onRangeChange} />
      </div>
      <div className="h-72 sm:h-80">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400">데이터 준비 중</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => formatPrice(Number(value), asset.unit)}
                width={70}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
                formatter={(value, name) => [
                  formatPrice(Number(value), asset.unit),
                  name === 'close' ? '종가' : '50일선',
                ]}
                labelFormatter={(label) => `날짜 ${label}`}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line type="monotone" dataKey="close" name="종가" stroke="#67e8f9" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ma50" name="50일선" stroke="#fbbf24" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
