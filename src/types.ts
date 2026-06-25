export type Status = '과열해소' | '정상' | '경계' | '과열';

export type AssetKey = 'kospi' | 'samsung' | 'skhynix';

export interface MarketPoint {
  date: string;
  close: number;
  ma50: number | null;
  disparity: number | null;
  status: Status | null;
}

export interface AssetData {
  symbol: string;
  name: string;
  unit: 'index' | 'krw';
  records: MarketPoint[];
}

export interface MarketData {
  generatedAt: string;
  source: string;
  assets: Record<AssetKey, AssetData>;
}

export type RangeKey = '3M' | '6M' | '1Y' | '2Y' | '5Y';
