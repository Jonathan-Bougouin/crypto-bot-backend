/**
 * Gestionnaire central de collecte de données
 * 
 * Coordonne tous les collecteurs et fournit une interface unifiée
 */

import MarketDataCollector, { MarketData } from './marketDataCollector';
import SentimentCollector, { SentimentData } from './sentimentCollector';

export interface CombinedData {
  symbol: string;
  timestamp: number;
  market: MarketData;
  sentiment: SentimentData;
}

export interface DataManagerConfig {
  symbols: string[];
  marketUpdateInterval: number;    // ms
  sentimentUpdateInterval: number; // ms
  enableMarketData: boolean;
  enableSentimentData: boolean;
}

/**
 * Gestionnaire de données
 */
export class DataManager {
  private config: DataManagerConfig;
  private marketCollector: MarketDataCollector;
  private sentimentCollector: SentimentCollector;
  
  private marketInterval?: NodeJS.Timeout;
  private sentimentInterval?: NodeJS.Timeout;
  
  private latestMarketData: Map<string, MarketData>;
  private latestSentimentData: Map<string, SentimentData>;
  
  private subscribers: ((data: CombinedData[]) => void)[];
  
  constructor(config: DataManagerConfig) {
    this.config = config;
    this.marketCollector = new MarketDataCollector(config.symbols, config.marketUpdateInterval);
    this.sentimentCollector = new SentimentCollector(config.symbols, config.sentimentUpdateInterval);
    
    this.latestMarketData = new Map();
    this.latestSentimentData = new Map();
    this.subscribers = [];
  }
  
  /**
   * Démarrer la collecte de données
   */
  start(): void {
    console.log('🚀 Démarrage du gestionnaire de données...');
    
    if (this.config.enableMarketData) {
      console.log('📊 Démarrage de la collecte de données de marché...');
      this.marketInterval = this.marketCollector.startContinuousCollection((data) => {
        this.handleMarketData(data);
      });
    }
    
    if (this.config.enableSentimentData) {
      console.log('💬 Démarrage de la collecte de sentiment...');
      this.sentimentInterval = this.sentimentCollector.startContinuousCollection((data) => {
        this.handleSentimentData(data);
      });
    }
    
    console.log('✅ Gestionnaire de données démarré');
  }
  
  /**
   * Arrêter la collecte de données
   */
  stop(): void {
    console.log('🛑 Arrêt du gestionnaire de données...');
    
    if (this.marketInterval) {
      this.marketCollector.stopCollection(this.marketInterval);
    }
    
    if (this.sentimentInterval) {
      this.sentimentCollector.stopCollection(this.sentimentInterval);
    }
    
    console.log('✅ Gestionnaire de données arrêté');
  }
  
  /**
   * Gérer les nouvelles données de marché
   */
  private handleMarketData(data: MarketData[]): void {
    data.forEach(item => {
      this.latestMarketData.set(item.symbol, item);
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Gérer les nouvelles données de sentiment
   */
  private handleSentimentData(data: SentimentData[]): void {
    data.forEach(item => {
      this.latestSentimentData.set(item.symbol, item);
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Notifier les abonnés des nouvelles données
   */
  private notifySubscribers(): void {
    const combinedData = this.getCombinedData();
    this.subscribers.forEach(callback => {
      try {
        callback(combinedData);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
  
  /**
   * S'abonner aux mises à jour de données
   */
  subscribe(callback: (data: CombinedData[]) => void): void {
    this.subscribers.push(callback);
    
    // Envoyer immédiatement les données actuelles
    const currentData = this.getCombinedData();
    if (currentData.length > 0) {
      callback(currentData);
    }
  }
  
  /**
   * Se désabonner des mises à jour
   */
  unsubscribe(callback: (data: CombinedData[]) => void): void {
    const index = this.subscribers.indexOf(callback);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }
  
  /**
   * Obtenir les données combinées
   */
  getCombinedData(): CombinedData[] {
    const combined: CombinedData[] = [];
    
    this.config.symbols.forEach(symbol => {
      const market = this.latestMarketData.get(symbol);
      const sentiment = this.latestSentimentData.get(symbol);
      
      if (market && sentiment) {
        combined.push({
          symbol,
          timestamp: Date.now(),
          market,
          sentiment
        });
      }
    });
    
    return combined;
  }
  
  /**
   * Obtenir les données de marché pour un symbole
   */
  getMarketData(symbol: string): MarketData | undefined {
    return this.latestMarketData.get(symbol);
  }
  
  /**
   * Obtenir les données de sentiment pour un symbole
   */
  getSentimentData(symbol: string): SentimentData | undefined {
    return this.latestSentimentData.get(symbol);
  }
  
  /**
   * Obtenir toutes les données de marché
   */
  getAllMarketData(): MarketData[] {
    return Array.from(this.latestMarketData.values());
  }
  
  /**
   * Obtenir toutes les données de sentiment
   */
  getAllSentimentData(): SentimentData[] {
    return Array.from(this.latestSentimentData.values());
  }
  
  /**
   * Obtenir les statistiques de collecte
   */
  getStats(): {
    symbols: number;
    marketDataPoints: number;
    sentimentDataPoints: number;
    subscribers: number;
    isRunning: boolean;
  } {
    return {
      symbols: this.config.symbols.length,
      marketDataPoints: this.latestMarketData.size,
      sentimentDataPoints: this.latestSentimentData.size,
      subscribers: this.subscribers.length,
      isRunning: this.marketInterval !== undefined || this.sentimentInterval !== undefined
    };
  }
}

/**
 * Instance singleton du gestionnaire de données
 */
let dataManagerInstance: DataManager | null = null;

/**
 * Obtenir l'instance du gestionnaire de données
 */
export function getDataManager(config?: DataManagerConfig): DataManager {
  if (!dataManagerInstance && config) {
    dataManagerInstance = new DataManager(config);
  }
  
  if (!dataManagerInstance) {
    throw new Error('DataManager not initialized. Provide a config on first call.');
  }
  
  return dataManagerInstance;
}

/**
 * Réinitialiser le gestionnaire de données
 */
export function resetDataManager(): void {
  if (dataManagerInstance) {
    dataManagerInstance.stop();
    dataManagerInstance = null;
  }
}

export default DataManager;
