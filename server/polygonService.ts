/**
 * Service Polygon.io pour récupérer les données de marché crypto en temps réel
 * Utilise le SDK Python de Polygon via des appels système
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Mapping des symboles de trading vers les tickers Polygon
export const TICKER_MAP: Record<string, string> = {
  'BTC-USD': 'X:BTCUSD',
  'ETH-USD': 'X:ETHUSD',
  'PEPE-USD': 'X:PEPEUSD',
};

// Mapping inverse
export const TICKER_TO_SYMBOL_MAP: Record<string, string> = {
  'X:BTCUSD': 'BTC-USD',
  'X:ETHUSD': 'ETH-USD',
  'X:PEPEUSD': 'PEPE-USD',
};

export interface CryptoPrice {
  symbol: string;
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  vwap: number;
  change24h: number;
  lastUpdated: Date;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

/**
 * Cache simple pour éviter trop d'appels API
 */
class SimpleCache<T> {
  private cache: Map<string, { data: T; expiry: number }> = new Map();

  set(key: string, data: T, ttlSeconds: number = 30) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const priceCache = new SimpleCache<CryptoPrice[]>();
const ohlcCache = new SimpleCache<OHLCData[]>();

/**
 * Récupère les prix actuels pour tous les coins configurés via Polygon
 */
export async function getCurrentPrices(): Promise<CryptoPrice[]> {
  const cacheKey = 'all_prices';
  const cached = priceCache.get(cacheKey);
  if (cached) {
    console.log('[Polygon] Returning cached prices');
    return cached;
  }

  try {
    const pythonScript = `
import os
from polygon import RESTClient
from datetime import datetime, timedelta
import json

api_key = os.getenv('POLYGON_API_KEY')
client = RESTClient(api_key=api_key)

tickers = ['X:BTCUSD', 'X:ETHUSD', 'X:PEPEUSD']
yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

results = []
for ticker in tickers:
    try:
        aggs = list(client.list_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="day",
            from_=yesterday,
            to=yesterday,
            limit=1
        ))
        if aggs:
            agg = aggs[0]
            change_pct = ((agg.close - agg.open) / agg.open) * 100 if agg.open > 0 else 0
            results.append({
                'ticker': ticker,
                'open': agg.open,
                'high': agg.high,
                'low': agg.low,
                'close': agg.close,
                'volume': agg.volume,
                'vwap': getattr(agg, 'vwap', agg.close),
                'change24h': change_pct,
                'timestamp': agg.timestamp
            })
    except Exception as e:
        print(f"Error for {ticker}: {e}", file=__import__('sys').stderr)

print(json.dumps(results))
`;

    const { stdout } = await execAsync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`, {
      timeout: 15000,
    });

    const rawData = JSON.parse(stdout.trim());
    
    const prices: CryptoPrice[] = rawData.map((data: any) => ({
      symbol: TICKER_TO_SYMBOL_MAP[data.ticker] || data.ticker,
      ticker: data.ticker,
      price: data.close,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      vwap: data.vwap,
      change24h: data.change24h,
      lastUpdated: new Date(data.timestamp),
    }));

    priceCache.set(cacheKey, prices, 30); // Cache pendant 30 secondes
    console.log(`[Polygon] Fetched prices for ${prices.length} coins`);
    return prices;
  } catch (error) {
    console.error('[Polygon] Error fetching prices:', error);
    throw new Error('Failed to fetch cryptocurrency prices from Polygon');
  }
}

/**
 * Récupère les données OHLC pour un coin spécifique
 */
export async function getOHLCData(symbol: string, days: number = 7): Promise<OHLCData[]> {
  const ticker = TICKER_MAP[symbol];
  if (!ticker) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  const cacheKey = `ohlc_${ticker}_${days}`;
  const cached = ohlcCache.get(cacheKey);
  if (cached) {
    console.log(`[Polygon] Returning cached OHLC data for ${symbol}`);
    return cached;
  }

  try {
    const pythonScript = `
import os
from polygon import RESTClient
from datetime import datetime, timedelta
import json

api_key = os.getenv('POLYGON_API_KEY')
client = RESTClient(api_key=api_key)

ticker = '${ticker}'
days = ${days}
from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
to_date = datetime.now().strftime('%Y-%m-%d')

results = []
try:
    aggs = client.list_aggs(
        ticker=ticker,
        multiplier=1,
        timespan="hour",
        from_=from_date,
        to=to_date,
        limit=5000
    )
    for agg in aggs:
        results.append({
            'timestamp': agg.timestamp,
            'open': agg.open,
            'high': agg.high,
            'low': agg.low,
            'close': agg.close,
            'volume': agg.volume,
            'vwap': getattr(agg, 'vwap', agg.close)
        })
except Exception as e:
    print(f"Error: {e}", file=__import__('sys').stderr)

print(json.dumps(results))
`;

    const { stdout } = await execAsync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`, {
      timeout: 15000,
    });

    const ohlcData: OHLCData[] = JSON.parse(stdout.trim());

    ohlcCache.set(cacheKey, ohlcData, 60); // Cache pendant 60 secondes
    console.log(`[Polygon] Fetched ${ohlcData.length} OHLC data points for ${symbol}`);
    return ohlcData;
  } catch (error) {
    console.error(`[Polygon] Error fetching OHLC data for ${symbol}:`, error);
    throw new Error(`Failed to fetch OHLC data for ${symbol}`);
  }
}

/**
 * Récupère le prix actuel pour un coin spécifique
 */
export async function getCoinPrice(symbol: string): Promise<CryptoPrice> {
  const prices = await getCurrentPrices();
  const price = prices.find(p => p.symbol === symbol);
  
  if (!price) {
    throw new Error(`Price not found for symbol: ${symbol}`);
  }
  
  return price;
}

/**
 * Nettoie tous les caches
 */
export function clearCache() {
  priceCache.clear();
  ohlcCache.clear();
  console.log('[Polygon] Cache cleared');
}
