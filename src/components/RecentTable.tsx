import type { AssetData, MarketPoint } from '../types';
import { formatDisparity, formatPrice, statusClassName } from '../utils/format';

interface RecentTableProps {
  asset: AssetData;
  records: MarketPoint[];
}

export function RecentTable({ asset, records }: RecentTableProps) {
  const rows = [...records]
    .filter((item) => item.ma50 != null && item.disparity != null)
    .reverse()
    .slice(0, 20);

  return (
    <section className="rounded-lg border border-white/10 bg-panel/88 p-4 shadow-glow sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">최근 기록</h2>
          <p className="mt-1 text-sm text-slate-400">최근 20개 거래일 기준</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-slate-400">데이터 준비 중</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="whitespace-nowrap px-3 py-3 font-medium">날짜</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">종가</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">50일선</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">이격도</th>
                <th className="whitespace-nowrap px-3 py-3 text-center font-medium">구간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {rows.map((row) => (
                <tr key={row.date} className="hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{row.date}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-white">
                    {formatPrice(row.close, asset.unit)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-slate-300">
                    {formatPrice(row.ma50, asset.unit)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-slate-100">
                    {formatDisparity(row.disparity)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center">
                    <span className={`inline-flex rounded border px-2 py-1 text-xs ${statusClassName(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
