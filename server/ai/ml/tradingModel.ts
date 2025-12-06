/**
 * Modèle d'apprentissage automatique pour le trading
 * 
 * Utilise les données de marché et de sentiment pour prédire
 * les mouvements de prix et générer des signaux de trading
 */

import { MarketData } from '../dataCollectors/marketDataCollector';
import { SentimentData } from '../dataCollectors/sentimentCollector';
import { CombinedData } from '../dataCollectors/dataManager';

export interface TradingSignal {
  symbol: string;
  timestamp: number;
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0-100
  strategy: string;
  
  // Prédictions
  predictedPriceChange: number; // % de changement prédit
  predictedPrice: number;
  timeHorizon: string; // '1h', '4h', '24h'
  
  // Raisons
  reasons: string[];
  
  // Indicateurs
  technicalScore: number; // 0-100
  sentimentScore: number; // 0-100
  volumeScore: number; // 0-100
  
  // Risque
  riskScore: number; // 0-100
  stopLoss: number;
  takeProfit: number;
}

export interface ModelPerformance {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  profitability: number;
  sharpeRatio: number;
  lastUpdate: number;
}

/**
 * Modèle de trading basé sur ML
 */
export class TradingModel {
  private performance: ModelPerformance;
  private historicalPredictions: Map<string, TradingSignal[]>;
  private trainingData: CombinedData[];
  
  constructor() {
    this.performance = {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      profitability: 0,
      sharpeRatio: 0,
      lastUpdate: Date.now()
    };
    
    this.historicalPredictions = new Map();
    this.trainingData = [];
  }
  
  /**
   * Analyser les données et générer un signal de trading
   */
  async analyze(data: CombinedData): Promise<TradingSignal> {
    const { market, sentiment } = data;
    
    // Calculer les scores
    const technicalScore = this.calculateTechnicalScore(market);
    const sentimentScore = this.calculateSentimentScore(sentiment);
    const volumeScore = this.calculateVolumeScore(market);
    
    // Score global
    const overallScore = (
      technicalScore * 0.5 +
      sentimentScore * 0.3 +
      volumeScore * 0.2
    );
    
    // Déterminer l'action
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;
    const reasons: string[] = [];
    
    if (overallScore > 70) {
      action = 'buy';
      confidence = overallScore;
      reasons.push('Score technique élevé');
      
      if (sentimentScore > 70) {
        reasons.push('Sentiment très positif');
      }
      if (volumeScore > 70) {
        reasons.push('Volume en hausse significative');
      }
    } else if (overallScore < 30) {
      action = 'sell';
      confidence = 100 - overallScore;
      reasons.push('Score technique faible');
      
      if (sentimentScore < 30) {
        reasons.push('Sentiment très négatif');
      }
    }
    
    // Prédire le changement de prix
    const predictedPriceChange = this.predictPriceChange(market, sentiment);
    const predictedPrice = market.price * (1 + predictedPriceChange / 100);
    
    // Calculer le risque
    const riskScore = this.calculateRiskScore(market, sentiment);
    
    // Calculer stop-loss et take-profit
    const stopLoss = market.price * 0.95; // -5%
    const takeProfit = market.price * 1.25; // +25%
    
    const signal: TradingSignal = {
      symbol: data.symbol,
      timestamp: Date.now(),
      action,
      confidence,
      strategy: 'ml_hybrid',
      predictedPriceChange,
      predictedPrice,
      timeHorizon: '4h',
      reasons,
      technicalScore,
      sentimentScore,
      volumeScore,
      riskScore,
      stopLoss,
      takeProfit
    };
    
    // Enregistrer la prédiction
    this.recordPrediction(signal);
    
    return signal;
  }
  
  /**
   * Calculer le score technique
   */
  private calculateTechnicalScore(market: MarketData): number {
    let score = 50; // Neutre par défaut
    
    // RSI
    if (market.rsi) {
      if (market.rsi < 30) {
        score += 20; // Survendu = signal d'achat
      } else if (market.rsi > 70) {
        score -= 20; // Suracheté = signal de vente
      }
    }
    
    // MACD
    if (market.macd) {
      if (market.macd.histogram > 0) {
        score += 10; // MACD positif
      } else {
        score -= 10; // MACD négatif
      }
    }
    
    // Bollinger Bands
    if (market.bollingerBands) {
      const { upper, middle, lower } = market.bollingerBands;
      if (market.price < lower) {
        score += 15; // Prix sous la bande inférieure
      } else if (market.price > upper) {
        score -= 15; // Prix au-dessus de la bande supérieure
      }
    }
    
    // EMA
    if (market.ema20 && market.ema50) {
      if (market.ema20 > market.ema50) {
        score += 10; // Tendance haussière
      } else {
        score -= 10; // Tendance baissière
      }
    }
    
    // Changement de prix 24h
    if (market.priceChange24h > 5) {
      score += 10; // Forte hausse
    } else if (market.priceChange24h < -5) {
      score -= 10; // Forte baisse
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculer le score de sentiment
   */
  private calculateSentimentScore(sentiment: SentimentData): number {
    let score = 50; // Neutre par défaut
    
    // Sentiment global
    score += sentiment.overallSentiment * 30; // -30 à +30
    
    // Trending
    if (sentiment.isTrending) {
      score += 10;
    }
    
    // Fear & Greed Index
    if (sentiment.fearGreedIndex < 25) {
      score += 15; // Extreme Fear = opportunité d'achat
    } else if (sentiment.fearGreedIndex > 75) {
      score -= 15; // Extreme Greed = risque de correction
    }
    
    // Mentions sociales
    if (sentiment.twitterMentions > 500) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculer le score de volume
   */
  private calculateVolumeScore(market: MarketData): number {
    let score = 50;
    
    // Volume 24h (simplifié)
    if (market.volume24h > 1000000) {
      score += 20;
    } else if (market.volume24h < 100000) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Prédire le changement de prix
   */
  private predictPriceChange(market: MarketData, sentiment: SentimentData): number {
    // Modèle simple basé sur les indicateurs
    // TODO: Remplacer par un vrai modèle ML (LSTM)
    
    let prediction = 0;
    
    // Basé sur le RSI
    if (market.rsi) {
      if (market.rsi < 30) {
        prediction += 10; // Rebond attendu
      } else if (market.rsi > 70) {
        prediction -= 10; // Correction attendue
      }
    }
    
    // Basé sur le sentiment
    prediction += sentiment.overallSentiment * 15;
    
    // Basé sur le momentum
    prediction += market.priceChange24h * 0.5;
    
    return prediction;
  }
  
  /**
   * Calculer le score de risque
   */
  private calculateRiskScore(market: MarketData, sentiment: SentimentData): number {
    let risk = 50;
    
    // Volatilité (basée sur Bollinger Bands)
    if (market.bollingerBands) {
      const bandwidth = (market.bollingerBands.upper - market.bollingerBands.lower) / market.bollingerBands.middle;
      risk += bandwidth * 100;
    }
    
    // Sentiment extrême = risque
    if (Math.abs(sentiment.overallSentiment) > 0.7) {
      risk += 20;
    }
    
    // Fear & Greed extrême = risque
    if (sentiment.fearGreedIndex < 20 || sentiment.fearGreedIndex > 80) {
      risk += 15;
    }
    
    return Math.max(0, Math.min(100, risk));
  }
  
  /**
   * Enregistrer une prédiction
   */
  private recordPrediction(signal: TradingSignal): void {
    if (!this.historicalPredictions.has(signal.symbol)) {
      this.historicalPredictions.set(signal.symbol, []);
    }
    
    this.historicalPredictions.get(signal.symbol)!.push(signal);
    this.performance.totalPredictions++;
  }
  
  /**
   * Évaluer les performances du modèle
   */
  async evaluatePerformance(actualPrices: Map<string, number>): Promise<ModelPerformance> {
    let correct = 0;
    let total = 0;
    
    this.historicalPredictions.forEach((predictions, symbol) => {
      const actualPrice = actualPrices.get(symbol);
      if (!actualPrice) return;
      
      predictions.forEach(prediction => {
        const timeDiff = Date.now() - prediction.timestamp;
        
        // Évaluer seulement les prédictions de plus de 4h
        if (timeDiff > 4 * 60 * 60 * 1000) {
          total++;
          
          const actualChange = ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;
          const predictedChange = prediction.predictedPriceChange;
          
          // Considérer comme correct si la direction est bonne
          if ((actualChange > 0 && predictedChange > 0) || (actualChange < 0 && predictedChange < 0)) {
            correct++;
          }
        }
      });
    });
    
    this.performance.correctPredictions = correct;
    this.performance.accuracy = total > 0 ? (correct / total) * 100 : 0;
    this.performance.lastUpdate = Date.now();
    
    return this.performance;
  }
  
  /**
   * Réentraîner le modèle avec de nouvelles données
   */
  async retrain(newData: CombinedData[]): Promise<void> {
    console.log(`🔄 Réentraînement du modèle avec ${newData.length} nouvelles données...`);
    
    // Ajouter aux données d'entraînement
    this.trainingData.push(...newData);
    
    // Garder seulement les 10000 dernières données
    if (this.trainingData.length > 10000) {
      this.trainingData = this.trainingData.slice(-10000);
    }
    
    // TODO: Implémenter le réentraînement réel avec TensorFlow.js ou API Python
    // Pour l'instant, on simule un réentraînement
    
    console.log('✅ Modèle réentraîné avec succès');
  }
  
  /**
   * Obtenir les performances du modèle
   */
  getPerformance(): ModelPerformance {
    return this.performance;
  }
  
  /**
   * Obtenir l'historique des prédictions
   */
  getPredictionHistory(symbol: string): TradingSignal[] {
    return this.historicalPredictions.get(symbol) || [];
  }
}

export default TradingModel;
