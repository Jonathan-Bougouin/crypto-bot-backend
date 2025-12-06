/**
 * Bot de Trading Autonome
 * 
 * Gère plusieurs stratégies simultanément avec allocation de budget
 * Prend des décisions de trading automatiquement basées sur le ML
 */

import { placeOrder } from '../../coinbaseService';
import { TradingModel, TradingSignal } from '../ml/tradingModel';
import { DataManager, CombinedData } from '../dataCollectors/dataManager';
import { sentimentAnalyzer } from '../ml/sentimentAnalyzer';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  timeframe: string; // '5m', '1h', '4h', '1d'
  targetProfit: number; // % de gain cible
  maxRisk: number; // % de risque maximum
  
  // Budget
  allocation: number; // % du capital total
  currentUsed: number; // Montant utilisé
  available: number; // Montant disponible
  
  // Performance
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  roi: number; // Return on Investment
  
  // État
  isActive: boolean;
  lastTradeTime: number;
}

export interface BotConfig {
  totalCapital: number;
  paperTrading: boolean;
  autoTrade: boolean;
  maxDailyTrades: number;
  maxOpenPositions: number;
  riskPerTrade: number; // % du capital par trade
  strategies: Strategy[];
}

export interface Position {
  id: string;
  symbol: string;
  strategy: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  stopLoss: number;
  takeProfit: number;
  openTime: number;
  status: 'open' | 'closed';
}

/**
 * Bot de Trading Autonome
 */
export class AutonomousBot {
  private config: BotConfig;
  private tradingModel: TradingModel;
  private dataManager: DataManager;
  
  private positions: Map<string, Position>;
  private dailyTrades: number;
  private lastResetDate: string;
  
  private isRunning: boolean;
  private updateInterval?: NodeJS.Timeout;
  
  constructor(config: BotConfig, tradingModel: TradingModel, dataManager: DataManager) {
    this.config = config;
    this.tradingModel = tradingModel;
    this.dataManager = dataManager;
    
    this.positions = new Map();
    this.dailyTrades = 0;
    this.lastResetDate = new Date().toISOString().split('T')[0];
    this.isRunning = false;
  }
  
  /**
   * Démarrer le bot
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Bot déjà en cours d\'exécution');
      return;
    }
    
    console.log('🤖 Démarrage du bot de trading autonome...');
    console.log(`💰 Capital total: ${this.config.totalCapital}€`);
    console.log(`📊 Nombre de stratégies: ${this.config.strategies.length}`);
    console.log(`🎯 Mode: ${this.config.paperTrading ? 'Paper Trading' : 'Trading Réel'}`);
    console.log(`🔄 Auto-trading: ${this.config.autoTrade ? 'Activé' : 'Désactivé'}`);
    
    this.isRunning = true;
    
    // S'abonner aux mises à jour de données
    this.dataManager.subscribe((data) => {
      this.handleDataUpdate(data);
    });
    
    // Vérifier les positions toutes les minutes
    this.updateInterval = setInterval(() => {
      this.checkPositions();
    }, 60000);
    
    console.log('✅ Bot démarré avec succès');
  }

  /**
   * Démarrer le trading pour un utilisateur spécifique (Méthode de compatibilité)
   */
  startTrading(userId: string, strategies: string[], maxPositionSize: number): void {
    console.log(`🚀 Activation du trading pour l'utilisateur ${userId}`);
    console.log(`   Stratégies: ${strategies.join(', ')}`);
    console.log(`   Taille max position: ${maxPositionSize}%`);
    
    // Mettre à jour la configuration
    this.config.autoTrade = true;
    this.config.paperTrading = false; // Mode réel forcé
    
    // Démarrer le bot si ce n'est pas déjà fait
    if (!this.isRunning) {
      this.start();
    }
  }
  
  /**
   * Arrêter le bot
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️  Bot n\'est pas en cours d\'exécution');
      return;
    }
    
    console.log('🛑 Arrêt du bot...');
    
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    console.log('✅ Bot arrêté');
  }
  
  /**
   * Gérer les mises à jour de données
   */
  private async handleDataUpdate(data: CombinedData[]): Promise<void> {
    if (!this.isRunning || !this.config.autoTrade) {
      return;
    }
    
    // Réinitialiser le compteur quotidien si nécessaire
    this.resetDailyCounterIfNeeded();
    
    // Vérifier si on peut encore trader aujourd'hui
    if (this.dailyTrades >= this.config.maxDailyTrades) {
      return;
    }
    
    // Analyser chaque symbole
    for (const combinedData of data) {
      try {
        await this.analyzeAndTrade(combinedData);
      } catch (error) {
        console.error(`Error analyzing ${combinedData.symbol}:`, error);
      }
    }
  }
  
  /**
   * Analyser et trader
   */
  private async analyzeAndTrade(data: CombinedData): Promise<void> {
    // Analyse de sentiment
    const sentiment = await sentimentAnalyzer.analyzeSentiment(data.symbol);
    const sentimentConfidence = sentimentAnalyzer.getConfidenceScore(sentiment);

    // Générer un signal de trading
    const signal = await this.tradingModel.analyze(data);
    
    // Ajuster la confiance avec le sentiment
    // Si le sentiment est très positif (>0.8), on booste la confiance du signal
    // Si le sentiment est négatif, on pénalise
    let adjustedConfidence = signal.confidence;
    if (sentimentConfidence > 0.8) {
      adjustedConfidence += 10; // Boost
    } else if (sentimentConfidence < 0.4) {
      adjustedConfidence -= 20; // Pénalité
    }

    // Vérifier si le signal est assez fort (seuil ajusté)
    if (adjustedConfidence < 75) { // Seuil plus strict pour viser 20-25%
      return; // Pas assez confiant
    }
    
    // Vérifier si on a déjà une position ouverte
    const existingPosition = Array.from(this.positions.values()).find(
      p => p.symbol === signal.symbol && p.status === 'open'
    );
    
    if (signal.action === 'buy' && !existingPosition) {
      await this.executeBuy(signal, data);
    } else if (signal.action === 'sell' && existingPosition) {
      await this.executeSell(signal, existingPosition);
    }
  }
   /**
   * Exécuter un achat
   */
  private async executeBuy(signal: TradingSignal, data: CombinedData): Promise<void> {
    // Vérifier le nombre de positions ouvertes
    const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open');
    if (openPositions.length >= this.config.maxOpenPositions) {
      console.log(`⚠️  Nombre maximum de positions ouvertes atteint (${this.config.maxOpenPositions})`);
      return;
    }
    
    // Trouver la stratégie appropriée
    const strategy = this.findBestStrategy(signal);
    if (!strategy || !strategy.isActive) {
      return;
    }
    
    // Calculer le montant à investir
    const amount = this.calculateTradeAmount(strategy, signal);
    if (amount <= 0) {
      console.log(`⚠️  Montant insuffisant pour trader ${signal.symbol}`);
      return;
    }
    
    // Calculer la quantité à acheter
    const quantity = amount / data.market.price;
    
    console.log(`\n🔵 SIGNAL D'ACHAT DÉTECTÉ`);
    console.log(`   Symbole: ${signal.symbol}`);
    console.log(`   Prix: ${data.market.price}€`);
    console.log(`   Montant: ${amount.toFixed(2)}€`);
    console.log(`   Quantité: ${quantity.toFixed(8)}`);
    console.log(`   Confiance: ${signal.confidence}%`);
    console.log(`   Stratégie: ${strategy.name}`);
    console.log(`   Raisons: ${signal.reasons.join(', ')}`);
    
    try {
      // Exécuter l'ordre
      const order = await placeOrder({
        symbol: signal.symbol,
        side: 'buy',
        amount: quantity,
        type: 'market'
      }, this.config.paperTrading);
      
      if (order.status === 'completed') {
        // Créer une position
        const position: Position = {
          id: order.orderId,
          symbol: signal.symbol,
          strategy: strategy.id,
          side: 'buy',
          entryPrice: order.price,
          currentPrice: order.price,
          quantity,
          investedAmount: amount,
          currentValue: amount,
          profitLoss: 0,
          profitLossPercent: 0,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          openTime: Date.now(),
          status: 'open'
        };
        
        this.positions.set(position.id, position);
        
        // Mettre à jour la stratégie
        strategy.currentUsed += amount;
        strategy.available -= amount;
        strategy.totalTrades++;
        
        this.dailyTrades++;
        
        console.log(`✅ Ordre d'achat exécuté avec succès`);
        console.log(`   ID: ${order.orderId}`);
      } else {
        console.log(`❌ Échec de l'ordre d'achat: ${order.message}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de l'achat:`, error);
    }
  }
  
  /**
   * Exécuter une vente
   */
  private async executeSell(signal: TradingSignal, position: Position): Promise<void> {
    console.log(`\n🔴 SIGNAL DE VENTE DÉTECTÉ`);
    console.log(`   Symbole: ${signal.symbol}`);
    console.log(`   Prix d'entrée: ${position.entryPrice}€`);
    console.log(`   Prix actuel: ${position.currentPrice}€`);
    console.log(`   P&L: ${position.profitLossPercent.toFixed(2)}%`);
    console.log(`   Confiance: ${signal.confidence}%`);
    
    try {
      // Exécuter l'ordre
      const order = await placeOrder({
        symbol: signal.symbol,
        side: 'sell',
        amount: position.quantity,
        type: 'market'
      }, this.config.paperTrading);
      
      if (order.status === 'completed') {
        // Fermer la position
        position.status = 'closed';
        position.currentPrice = order.price;
        position.currentValue = position.quantity * order.price;
        position.profitLoss = position.currentValue - position.investedAmount;
        position.profitLossPercent = (position.profitLoss / position.investedAmount) * 100;

        // Feedback Loop : Enregistrer le résultat pour améliorer l'IA
        await sentimentAnalyzer.recordTradeFeedback({
          tradeId: position.id,
          symbol: position.symbol,
          entryPrice: position.entryPrice,
          exitPrice: position.currentPrice,
          profitPercent: position.profitLossPercent,
          duration: Date.now() - position.openTime,
          sentimentAtEntry: { score: 0, magnitude: 0, sources: { twitter: 0, reddit: 0, news: 0 }, keywords: [] }, // À enrichir avec le vrai historique
          strategyUsed: position.strategy,
          success: position.profitLoss > 0
        });
        
        // Mettre à jour la stratégie
        const strategy = this.config.strategies.find(s => s.id === position.strategy);
        if (strategy) {
          strategy.currentUsed -= position.investedAmount;
          strategy.available += position.currentValue;
          strategy.totalProfit += position.profitLoss;
          
          if (position.profitLoss > 0) {
            strategy.winningTrades++;
          } else {
            strategy.losingTrades++;
          }
          
          strategy.roi = (strategy.totalProfit / (strategy.allocation * this.config.totalCapital / 100)) * 100;
        }
        
        this.dailyTrades++;
        
        console.log(`✅ Ordre de vente exécuté avec succès`);
        console.log(`   Profit/Perte: ${position.profitLoss.toFixed(2)}€ (${position.profitLossPercent.toFixed(2)}%)`);
      } else {
        console.log(`❌ Échec de l'ordre de vente: ${order.message}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de la vente:`, error);
    }
  }
  
  /**
   * Vérifier les positions (stop-loss, take-profit)
   */
  private async checkPositions(): Promise<void> {
    const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open');
    
    for (const position of openPositions) {
      // Récupérer le prix actuel
      const marketData = this.dataManager.getMarketData(position.symbol);
      if (!marketData) continue;
      
      position.currentPrice = marketData.price;
      position.currentValue = position.quantity * marketData.price;
      position.profitLoss = position.currentValue - position.investedAmount;
      position.profitLossPercent = (position.profitLoss / position.investedAmount) * 100;
      
      // Vérifier stop-loss
      if (position.currentPrice <= position.stopLoss) {
        console.log(`🛑 Stop-Loss déclenché pour ${position.symbol}`);
        await this.closePosition(position, 'stop-loss');
      }
      
      // Vérifier take-profit
      else if (position.currentPrice >= position.takeProfit) {
        console.log(`🎯 Take-Profit atteint pour ${position.symbol}`);
        await this.closePosition(position, 'take-profit');
      }
    }
  }
  
  /**
   * Fermer une position
   */
  private async closePosition(position: Position, reason: string): Promise<void> {
    try {
      const order = await placeOrder({
        symbol: position.symbol,
        side: 'sell',
        amount: position.quantity,
        type: 'market'
      }, this.config.paperTrading);
      
      if (order.status === 'completed') {
        position.status = 'closed';
        position.currentPrice = order.price;
        position.currentValue = position.quantity * order.price;
        position.profitLoss = position.currentValue - position.investedAmount;
        position.profitLossPercent = (position.profitLoss / position.investedAmount) * 100;
        
        console.log(`✅ Position fermée (${reason})`);
        console.log(`   P&L: ${position.profitLoss.toFixed(2)}€ (${position.profitLossPercent.toFixed(2)}%)`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la fermeture de la position:`, error);
    }
  }
  
  /**
   * Trouver la meilleure stratégie pour un signal
   */
  private findBestStrategy(signal: TradingSignal): Strategy | undefined {
    // Pour l'instant, on utilise la première stratégie active avec du budget disponible
    return this.config.strategies.find(s => 
      s.isActive && s.available > 0
    );
  }
  
  /**
   * Calculer le montant à trader
   */
  private calculateTradeAmount(strategy: Strategy, signal: TradingSignal): number {
    const maxAmount = strategy.available;
    const riskAmount = (this.config.totalCapital * this.config.riskPerTrade) / 100;
    
    return Math.min(maxAmount, riskAmount);
  }
  
  /**
   * Réinitialiser le compteur quotidien si nécessaire
   */
  private resetDailyCounterIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.dailyTrades = 0;
      this.lastResetDate = today;
    }
  }
  
  /**
   * Obtenir les statistiques du bot
   */
  getStats(): {
    isRunning: boolean;
    totalCapital: number;
    openPositions: number;
    dailyTrades: number;
    strategies: Strategy[];
  } {
    const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open').length;
    
    return {
      isRunning: this.isRunning,
      totalCapital: this.config.totalCapital,
      openPositions,
      dailyTrades: this.dailyTrades,
      strategies: this.config.strategies
    };
  }
  
  /**
   * Obtenir les positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }
}

export default AutonomousBot;
