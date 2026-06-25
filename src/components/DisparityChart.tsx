import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MarketPoint, RangeKey } from '../types';
import { formatDisparity } from '../utils/format';
import { RangeSelector } from './RangeSelector';

interface DisparityChartProps {
  data: MarketPoint[];
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}

export function DisparityChart({ data, range, onRangeChange }: DisparityChartProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/88 p-4 shadow-glow sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">50일 이격도 추이</h2>
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
                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                width={52}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              {[105, 120, 130].map((value) => (
                <ReferenceLine
                  key={value}
                  y={value}
                  stroke={value === 130 ? '#fb7185' : value === 120 ? '#f59e0b' : '#38bdf8'}
                  strokeDasharray="4 4"
                  label={{ value: `${value}`, fill: '#cbd5e1', fontSize: 12, position: 'insideTopRight' }}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
                formatter={(value) => [formatDisparity(Number(value)), '이격도']}
                labelFormatter={(label) => `날짜 ${label}`}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line
                type="monotone"
                dataKey="disparity"
                name="50일 이격도"
                stroke="#a7f3d0"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
