export type MarketCode = 'LB' | 'AE' | 'US' | 'GB' | 'DE';

export type Market = {
  code: MarketCode;
  label: string;
  latitude: number;
  longitude: number;
};

export const MARKETS: Market[] = [
  {code: 'LB', label: 'Lebanon', latitude: 33.8938, longitude: 35.5018},
  {code: 'AE', label: 'UAE', latitude: 25.2048, longitude: 55.2708},
  {code: 'US', label: 'USA', latitude: 37.7749, longitude: -122.4194},
  {code: 'GB', label: 'UK', latitude: 51.5074, longitude: -0.1278},
  {code: 'DE', label: 'Germany', latitude: 52.52, longitude: 13.405},
];

export const getMarket = (code: string): Market =>
  MARKETS.find(m => m.code === code) ?? MARKETS[0];
