/**
 * Collecteur de données de marché en temps réel
 * 
 * Collecte :
 * - Prix et volume
 * - Indicateurs techniques
 * - Order book
 * - Données historiques
 */

import { getRealPrice, getRealProduct } from '../../coinbaseRealClient';

export interface MarketData {
  symbol: string;
  timestamp: number;
  price: number;
  volume24h: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  
  // Indicateurs techniques
  rsi?: number;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema20?: number;
  ema50?: number;
  sma20?: number;
  sma50?: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'
  data: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

/**
 * Collecteur principal de données de marché
 */
export class MarketDataCollector {
  private symbols: string[];
  private updateInterval: number;
  private historicalData: Map<string, HistoricalData[]>;
  
  constructor(symbols: string[], updateInterval: number = 30000) {
    this.symbols = symbols;
    this.updateInterval = updateInterval;
    this.historicalData = new Map();
  }
  
  /**
   * Collecter les données actuelles du marché
   */
  async collectCurrentData(symbol: string): Promise<MarketData> {
    try {
      const product = await getRealProduct(symbol);
      
      if (!product || !product.price) {
        throw new Error(`No data available for ${symbol}`);
      }
      
      const marketData: MarketData = {
        symbol,
        timestamp: Date.now(),
        price: parseFloat(product.price),
        volume24h: parseFloat(product.volume_24h || '0'),
        priceChange24h: parseFloat(product.price_percentage_change_24h || '0'),
        high24h: 0, // À calculer depuis l'historique
        low24h: 0,  // À calculer depuis l'historique
      };
      
      return marketData;
    } catch (error) {
      console.error(`Error collecting market data for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Collecter les données pour tous les symboles
   */
  async collectAllSymbols(): Promise<MarketData[]> {
    const promises = this.symbols.map(symbol => this.collectCurrentData(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<MarketData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }
  
  /**
   * Calculer les indicateurs techniques
   */
  calculateTechnicalIndicators(data: MarketData, historical: number[]): MarketData {
    // RSI (Relative Strength Index)
    data.rsi = this.calculateRSI(historical);
    
    // MACD
    data.macd = this.calculateMACD(historical);
    
    // Bollinger Bands
    data.bollingerBands = this.calculateBollingerBands(historical);
    
    // EMA (Exponential Moving Average)
    data.ema20 = this.calculateEMA(historical, 20);
    data.ema50 = this.calculateEMA(historical, 50);
    
    // SMA (Simple Moving Average)
    data.sma20 = this.calculateSMA(historical, 20);
    data.sma50 = this.calculateSMA(historical, 50);
    
    return data;
  }
  
  /**
   * Calculer le RSI
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Valeur neutre par défaut
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }
  
  /**
   * Calculer le MACD
   */
  private calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // Signal line (EMA 9 du MACD)
    const macdHistory = [macdLine]; // Simplifié pour l'exemple
    const signalLine = this.calculateEMA(macdHistory, 9);
    
    const histogram = macdLine - signalLine;
    
    return {
      value: macdLine,
      signal: signalLine,
      histogram
    };
  }
  
  /**
   * Calculer les Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }
  
  /**
   * Calculer l'EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return this.calculateSMA(prices, prices.length);
    }
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }
  
  /**
   * Calculer la SMA (Simple Moving Average)
   */
  private calculateSMA(prices: number[], period: number): number {
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }
  
  /**
   * Démarrer la collecte en continu
   */
  startContinuousCollection(callback: (data: MarketData[]) => void): NodeJS.Timeout {
    const interval = setInterval(async () => {
      try {
        const data = await this.collectAllSymbols();
        callback(data);
      } catch (error) {
        console.error('Error in continuous collection:', error);
      }
    }, this.updateInterval);
    
    // Collecter immédiatement au démarrage
    this.collectAllSymbols().then(callback).catch(console.error);
    
    return interval;
  }
  
  /**
   * Arrêter la collecte
   */
  stopCollection(interval: NodeJS.Timeout): void {
    clearInterval(interval);
  }
}

export default MarketDataCollector;
