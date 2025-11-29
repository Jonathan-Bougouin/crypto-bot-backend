/**
 * Service CoinGecko pour récupérer les données de marché en temps réel
 */

import axios from 'axios';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Mapping des symboles de trading vers les IDs CoinGecko
export const COIN_ID_MAP: Record<string, string> = {
  'BTC-USD': 'bitcoin',
  'ETH-USD': 'ethereum',
  'PEPE-USD': 'pepe',
};

// Mapping inverse pour retrouver le symbole depuis l'ID
export const ID_TO_SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTC-USD',
  'ethereum': 'ETH-USD',
  'pepe': 'PEPE-USD',
};

export interface CoinPrice {
  symbol: string;
  coinId: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  lastUpdated: Date;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
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

const priceCache = new SimpleCache<CoinPrice[]>();
const ohlcCache = new SimpleCache<OHLCData[]>();

/**
 * Récupère les prix actuels pour tous les coins configurés
 */
export async function getCurrentPrices(): Promise<CoinPrice[]> {
  const cacheKey = 'all_prices';
  const cached = priceCache.get(cacheKey);
  if (cached) {
    console.log('[CoinGecko] Returning cached prices');
    return cached;
  }

  try {
    const coinIds = Object.values(COIN_ID_MAP).join(',');
    const response = await axios.get(`${COINGECKO_API_BASE}/simple/price`, {
      params: {
        ids: coinIds,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
        include_last_updated_at: true,
      },
      timeout: 10000,
    });

    const prices: CoinPrice[] = Object.entries(response.data).map(([coinId, data]: [string, any]) => ({
      symbol: ID_TO_SYMBOL_MAP[coinId] || coinId.toUpperCase(),
      coinId,
      price: data.usd,
      marketCap: data.usd_market_cap || 0,
      volume24h: data.usd_24h_vol || 0,
      change24h: data.usd_24h_change || 0,
      lastUpdated: new Date(data.last_updated_at * 1000),
    }));

    priceCache.set(cacheKey, prices, 30); // Cache pendant 30 secondes
    console.log(`[CoinGecko] Fetched prices for ${prices.length} coins`);
    return prices;
  } catch (error) {
    console.error('[CoinGecko] Error fetching prices:', error);
    throw new Error('Failed to fetch cryptocurrency prices');
  }
}

/**
 * Récupère les données OHLC pour un coin spécifique
 */
export async function getOHLCData(symbol: string, days: number = 1): Promise<OHLCData[]> {
  const coinId = COIN_ID_MAP[symbol];
  if (!coinId) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  const cacheKey = `ohlc_${coinId}_${days}`;
  const cached = ohlcCache.get(cacheKey);
  if (cached) {
    console.log(`[CoinGecko] Returning cached OHLC data for ${symbol}`);
    return cached;
  }

  try {
    const response = await axios.get(`${COINGECKO_API_BASE}/coins/${coinId}/ohlc`, {
      params: {
        vs_currency: 'usd',
        days: days.toString(),
      },
      timeout: 10000,
    });

    const ohlcData: OHLCData[] = response.data.map((item: number[]) => ({
      timestamp: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
    }));

    ohlcCache.set(cacheKey, ohlcData, 60); // Cache pendant 60 secondes
    console.log(`[CoinGecko] Fetched ${ohlcData.length} OHLC data points for ${symbol}`);
    return ohlcData;
  } catch (error) {
    console.error(`[CoinGecko] Error fetching OHLC data for ${symbol}:`, error);
    throw new Error(`Failed to fetch OHLC data for ${symbol}`);
  }
}

/**
 * Récupère le prix actuel pour un coin spécifique
 */
export async function getCoinPrice(symbol: string): Promise<CoinPrice> {
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
  console.log('[CoinGecko] Cache cleared');
}
