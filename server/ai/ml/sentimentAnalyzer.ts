import { z } from 'zod';

// Types pour l'analyse de sentiment
export interface SentimentScore {
  score: number; // -1 à 1
  magnitude: number; // 0 à 1
  sources: {
    twitter: number;
    reddit: number;
    news: number;
  };
  keywords: string[];
}

export interface TradeFeedback {
  tradeId: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  profitPercent: number;
  duration: number;
  sentimentAtEntry: SentimentScore;
  strategyUsed: string;
  success: boolean;
}

/**
 * Analyseur de sentiment avancé avec Feedback Loop
 */
export class SentimentAnalyzer {
  private feedbackHistory: TradeFeedback[] = [];
  private weights = {
    twitter: 0.4,
    reddit: 0.3,
    news: 0.3,
  };

  /**
   * Analyser le sentiment actuel pour un symbole
   * (Simulation pour l'instant, à connecter aux vraies API plus tard)
   */
  async analyzeSentiment(symbol: string): Promise<SentimentScore> {
    // Simulation basée sur des patterns aléatoires mais cohérents
    const baseScore = (Math.random() * 2) - 1; // -1 à 1
    const magnitude = Math.random();
    
    return {
      score: baseScore,
      magnitude,
      sources: {
        twitter: baseScore + (Math.random() * 0.2 - 0.1),
        reddit: baseScore + (Math.random() * 0.4 - 0.2),
        news: baseScore + (Math.random() * 0.1 - 0.05),
      },
      keywords: ['bullish', 'pump', 'moon', 'breakout'],
    };
  }

  /**
   * Enregistrer le résultat d'un trade pour l'apprentissage (Feedback Loop)
   */
  async recordTradeFeedback(feedback: TradeFeedback): Promise<void> {
    this.feedbackHistory.push(feedback);
    await this.optimizeWeights();
  }

  /**
   * Optimiser les poids des sources en fonction des résultats passés
   * C'est ici que l'IA "apprend" quelles sources sont les plus fiables
   */
  private async optimizeWeights(): Promise<void> {
    if (this.feedbackHistory.length < 10) return; // Besoin de données

    let twitterCorrelation = 0;
    let redditCorrelation = 0;
    let newsCorrelation = 0;

    // Calculer la corrélation entre le sentiment de chaque source et le succès du trade
    for (const trade of this.feedbackHistory) {
      const result = trade.success ? 1 : -1;
      
      twitterCorrelation += (trade.sentimentAtEntry.sources.twitter * result);
      redditCorrelation += (trade.sentimentAtEntry.sources.reddit * result);
      newsCorrelation += (trade.sentimentAtEntry.sources.news * result);
    }

    // Normaliser les corrélations pour obtenir de nouveaux poids
    const total = Math.abs(twitterCorrelation) + Math.abs(redditCorrelation) + Math.abs(newsCorrelation);
    
    if (total > 0) {
      this.weights = {
        twitter: Math.abs(twitterCorrelation) / total,
        reddit: Math.abs(redditCorrelation) / total,
        news: Math.abs(newsCorrelation) / total,
      };
      
      console.log('🧠 Poids du sentiment optimisés:', this.weights);
    }
  }

  /**
   * Obtenir le score de confiance ajusté par l'apprentissage
   */
  getConfidenceScore(sentiment: SentimentScore): number {
    const weightedScore = 
      (sentiment.sources.twitter * this.weights.twitter) +
      (sentiment.sources.reddit * this.weights.reddit) +
      (sentiment.sources.news * this.weights.news);
      
    return (weightedScore + 1) / 2; // Normaliser entre 0 et 1
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
