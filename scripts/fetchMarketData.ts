import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { calculateIndicators } from '../src/utils/calculateIndicators';
import type { AssetData, AssetKey, MarketData } from '../src/types';

const assets: Record<
  AssetKey,
  Pick<AssetData, 'symbol' | 'name' | 'unit'> & {
    naverType: 'index' | 'stock';
    naverSymbol: string;
    yahooSymbol: string;
  }
> = {
  kospi: {
    symbol: '^KS11',
    name: '코스피',
    unit: 'index',
    naverType: 'index',
    naverSymbol: 'KOSPI',
    yahooSymbol: '^KS11',
  },
  samsung: {
    symbol: '005930.KS',
    name: '삼성전자',
    unit: 'krw',
    naverType: 'stock',
    naverSymbol: '005930',
    yahooSymbol: '005930.KS',
  },
  skhynix: {
    symbol: '000660.KS',
    name: 'SK하이닉스',
    unit: 'krw',
    naverType: 'stock',
    naverSymbol: '000660',
    yahooSymbol: '000660.KS',
  },
};

interface YahooChartResponse {
  chart: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
    error?: unknown;
  };
}

interface NaverPriceRow {
  localTradedAt?: string;
  closePrice?: string;
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchFromNaver(asset: (typeof assets)[AssetKey]) {
  const endpoint =
    asset.naverType === 'index'
      ? `https://m.stock.naver.com/api/index/${asset.naverSymbol}/price`
      : `https://m.stock.naver.com/api/stock/${asset.naverSymbol}/price`;
  const headers = {
    Accept: 'application/json',
    Referer: 'https://m.stock.naver.com/',
    'User-Agent': 'Mozilla/5.0 korea-market-ma50-disparity-tracker',
  };
  const targetOldestDate = new Date();
  targetOldestDate.setFullYear(targetOldestDate.getFullYear() - 5);
  targetOldestDate.setDate(targetOldestDate.getDate() - 90);

  const payload: NaverPriceRow[] = [];
  for (let page = 1; page <= 30; page += 1) {
    const url = new URL(endpoint);
    url.searchParams.set('pageSize', '60');
    url.searchParams.set('page', String(page));

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Naver Finance request failed for ${asset.naverSymbol}: HTTP ${response.status}`);
    }

    const pageRows = (await response.json()) as NaverPriceRow[];
    if (pageRows.length === 0) break;

    payload.push(...pageRows);
    const oldest = pageRows.at(-1)?.localTradedAt;
    if (oldest && new Date(oldest) <= targetOldestDate) break;
  }

  const rows = payload
    .map((item) => {
      const close = parseNumber(item.closePrice);
      if (!item.localTradedAt || close == null) return null;
      return { date: item.localTradedAt, close };
    })
    .filter((item): item is { date: string; close: number } => item != null)
    .filter((item, index, self) => self.findIndex((other) => other.date === item.date) === index)
    .reverse();

  if (rows.length < 50) {
    throw new Error(`Naver Finance returned too few rows for ${asset.naverSymbol}`);
  }

  return calculateIndicators(rows).slice(-1260);
}

async function fetchFromYahoo(symbol: string) {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 60 * 60 * 24 * 365 * 5 - 60 * 60 * 24 * 90;
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set('period1', String(period1));
  url.searchParams.set('period2', String(period2));
  url.searchParams.set('interval', '1d');
  url.searchParams.set('events', 'history');
  url.searchParams.set('includeAdjustedClose', 'true');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 korea-market-ma50-disparity-tracker',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed for ${symbol}: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const rows = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (close == null || Number.isNaN(close)) return null;
      return {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        close: Number(close.toFixed(2)),
      };
    })
    .filter((item): item is { date: string; close: number } => item != null);

  return calculateIndicators(rows).slice(-1260);
}

async function fetchAsset(asset: (typeof assets)[AssetKey]) {
  try {
    return await fetchFromNaver(asset);
  } catch (error) {
    console.warn(`Naver Finance failed for ${asset.naverSymbol}. Falling back to Yahoo Finance.`);
    console.warn(error);
    return fetchFromYahoo(asset.yahooSymbol);
  }
}

async function main() {
  const entries = await Promise.all(
    Object.entries(assets).map(async ([key, meta]) => {
      const records = await fetchAsset(meta);
      return [
        key,
        {
          symbol: meta.symbol,
          name: meta.name,
          unit: meta.unit,
          records,
        },
      ] as const;
    }),
  );

  const marketData: MarketData = {
    generatedAt: new Date().toISOString(),
    source: 'Naver Finance mobile API, Yahoo Finance fallback',
    assets: Object.fromEntries(entries) as MarketData['assets'],
  };

  const outputPath = resolve('public/data/market-data.json');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(marketData, null, 2)}\n`, 'utf8');
  console.log(`Saved ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
