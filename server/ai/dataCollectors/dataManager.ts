/**
 * Gestionnaire central de collecte de données
 * 
 * Coordonne tous les collecteurs et fournit une interface unifiée
 * Version optimisée pour le Top 100 dynamique
 */

import MarketDataCollector, { MarketData } from './marketDataCollector';
import SentimentCollector, { SentimentData } from './sentimentCollector';
import { Coinbase } from "@coinbase/coinbase-sdk";

export interface CombinedData {
  symbol: string;
  timestamp: number;
  market: MarketData;
  sentiment: SentimentData;
}

export interface DataManagerConfig {
  symbols: string[]; // Liste initiale (sera écrasée par le Top 100)
  marketUpdateInterval: number;    // ms
  sentimentUpdateInterval: number; // ms
  enableMarketData: boolean;
  enableSentimentData: boolean;
  useTop100?: boolean; // Nouvelle option pour activer le mode Scanner
  useTop500?: boolean; // Nouvelle option pour activer le mode Scanner Top 500 (nécessite VPS)
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
  private top100RefreshInterval?: NodeJS.Timeout;
  
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
  async start(): Promise<void> {
    console.log('🚀 Démarrage du gestionnaire de données...');
    
    // Si le mode Top 100 ou Top 500 est activé, récupérer la liste dynamique
    if (this.config.useTop100 || this.config.useTop500) {
      const mode = this.config.useTop500 ? 'Top 500' : 'Top 100';
      console.log(`🌪️ Mode Scanner ${mode} activé : Récupération des paires...`);
      await this.refreshTopPairs();
      
      // Rafraîchir la liste toutes les heures
      this.top100RefreshInterval = setInterval(() => {
        this.refreshTopPairs();
      }, 60 * 60 * 1000);
    }
    
    if (this.config.enableMarketData) {
      console.log(`📊 Démarrage de la collecte de données de marché pour ${this.config.symbols.length} paires...`);
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
   * Récupérer le Top 100 ou Top 500 des paires depuis Coinbase
   */
  private async refreshTopPairs(): Promise<void> {
    try {
      // Note: Dans une implémentation réelle, on appellerait l'API Coinbase ici
      // Pour l'instant, on simule une liste étendue pour éviter de bloquer sans clés API
      // TODO: Intégrer client.getProducts() filtré par volume
      
      const limit = this.config.useTop500 ? 500 : 100;
      
      // Simulation de la récupération des paires
      // Dans la réalité, on ferait: const products = await client.getProducts();
      
      const topPairs = [
        "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "ADA-USD", "AVAX-USD", "DOGE-USD", "DOT-USD",
        "LINK-USD", "MATIC-USD", "SHIB-USD", "LTC-USD", "UNI-USD", "ATOM-USD", "ETC-USD", "XLM-USD",
        "BCH-USD", "FIL-USD", "APT-USD", "NEAR-USD", "ARB-USD", "OP-USD", "INJ-USD", "RNDR-USD",
        "PEPE-USD", "BONK-USD", "TIA-USD", "SUI-USD", "SEI-USD", "LDO-USD"
      ];
      
      // Si Top 500 demandé, on génère des paires fictives pour la simulation
      if (this.config.useTop500) {
        for (let i = topPairs.length; i < limit; i++) {
          topPairs.push(`COIN${i}-USD`);
        }
      }
      
      console.log(`🔄 Mise à jour de la liste des paires : ${topPairs.length} actifs détectés (Mode ${limit})`);
      
      // Mettre à jour la config
      this.config.symbols = topPairs;
      
      // Mettre à jour les collecteurs
      // Note: MarketDataCollector gère déjà le partitionnement interne si > 300 paires
      this.marketCollector.updateSymbols(topPairs);
      this.sentimentCollector.updateSymbols(topPairs);
      
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement des paires:", error);
    }
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
    
    if (this.top100RefreshInterval) {
      clearInterval(this.top100RefreshInterval);
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
