import { useEffect, useMemo, useState } from 'react';
import { AssetTabs } from './components/AssetTabs';
import { DisparityChart } from './components/DisparityChart';
import { DisparityGauge } from './components/DisparityGauge';
import { Header } from './components/Header';
import { PriceChart } from './components/PriceChart';
import { RecentTable } from './components/RecentTable';
import { SummaryCards } from './components/SummaryCards';
import type { AssetKey, MarketData, RangeKey } from './types';
import { filterByRange, getLatestValid } from './utils/format';

const fallbackDataUrl = `${import.meta.env.BASE_URL}data/market-data.json`;

function App() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>('kospi');
  const [priceRange, setPriceRange] = useState<RangeKey>('1Y');
  const [disparityRange, setDisparityRange] = useState<RangeKey>('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const response = await fetch(fallbackDataUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as MarketData;
        setMarketData(data);
      } catch {
        setError('데이터를 불러오지 못했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const asset = marketData?.assets[selectedAsset] ?? null;
  const latest = useMemo(() => (asset ? getLatestValid(asset.records) : null), [asset]);
  const priceData = useMemo(() => (asset ? filterByRange(asset.records, priceRange) : []), [asset, priceRange]);
  const disparityData = useMemo(
    () => (asset ? filterByRange(asset.records, disparityRange) : []),
    [asset, disparityRange],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <Header />

      {isLoading && (
        <div className="rounded-lg border border-white/10 bg-panel/88 p-10 text-center text-slate-300">
          데이터 준비 중
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-10 text-center text-rose-100">
          {error}
        </div>
      )}

      {!isLoading && marketData && asset && (
        <div className="space-y-5">
          <AssetTabs assets={marketData.assets} selected={selectedAsset} onSelect={setSelectedAsset} />
          <SummaryCards asset={asset} latest={latest} />
          <DisparityGauge latest={latest} />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <PriceChart asset={asset} data={priceData} range={priceRange} onRangeChange={setPriceRange} />
            <DisparityChart data={disparityData} range={disparityRange} onRangeChange={setDisparityRange} />
          </div>
          <RecentTable asset={asset} records={asset.records} />
          <footer className="pb-4 pt-2 text-center text-xs text-slate-500">
            데이터: Yahoo Finance 공개 데이터 · 갱신: 매 거래일 12:00 / 15:40 KST · 정보 제공용
          </footer>
        </div>
      )}
    </main>
  );
}

export default App;
