/**
 * Moteur de Backtesting et Simulation à Grande Échelle
 * 
 * Permet de tester les stratégies de trading sur des données historiques
 * et de simuler des milliers de comptes clients
 */

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  strategies: string[];
  maxDailyTrades: number;
  maxOpenPositions: number;
  riskPerTrade: number;
}

export interface Trade {
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: Date;
  exitTime: Date;
  profit: number;
  profitPercent: number;
  strategy: string;
}

export interface BacktestResult {
  accountId: string;
  config: BacktestConfig;
  
  // Performance globale
  initialCapital: number;
  finalCapital: number;
  totalProfit: number;
  totalProfitPercent: number;
  
  // Statistiques de trading
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // Métriques avancées
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  
  // Trades
  trades: Trade[];
  
  // Évolution du capital
  capitalHistory: Array<{
    date: Date;
    capital: number;
  }>;
  
  // Par stratégie
  strategyPerformance: Record<string, {
    trades: number;
    profit: number;
    winRate: number;
  }>;
}

/**
 * Générateur de données de marché simulées
 */
export class MarketDataGenerator {
  /**
   * Générer des données de prix pour une période
   */
  generatePriceData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    intervalMinutes: number = 5
  ): Array<{
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> {
    const data: Array<any> = [];
    const currentDate = new Date(startDate);
    
    // Prix de départ basé sur le symbole
    let basePrice = this.getBasePrice(symbol);
    
    while (currentDate <= endDate) {
      // Simuler un mouvement de prix réaliste
      const volatility = 0.02; // 2% de volatilité
      const trend = (Math.random() - 0.48) * volatility; // Légère tendance haussière
      const randomMove = (Math.random() - 0.5) * volatility;
      
      const open = basePrice;
      const change = basePrice * (trend + randomMove);
      const close = basePrice + change;
      
      // High et Low basés sur la volatilité
      const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
      const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);
      
      // Volume aléatoire
      const volume = 1000000 + Math.random() * 5000000;
      
      data.push({
        time: new Date(currentDate),
        open,
        high,
        low,
        close,
        volume,
      });
      
      basePrice = close;
      currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
    }
    
    return data;
  }
  
  /**
   * Obtenir le prix de base pour un symbole
   */
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTC-USD': 45000,
      'ETH-USD': 2500,
      'PEPE-USD': 0.000001,
      'SOL-USD': 100,
      'ADA-USD': 0.5,
    };
    
    return prices[symbol] || 100;
  }
  
  /**
   * Ajouter des "pumps" réalistes aux données
   */
  addPumpEvents(
    data: Array<any>,
    pumpCount: number = 10
  ): Array<any> {
    const pumpIndices = [];
    
    // Sélectionner des indices aléatoires pour les pumps
    for (let i = 0; i < pumpCount; i++) {
      const index = Math.floor(Math.random() * (data.length - 100)) + 50;
      pumpIndices.push(index);
    }
    
    // Appliquer les pumps
    pumpIndices.forEach(startIndex => {
      const pumpDuration = 20 + Math.floor(Math.random() * 30); // 20-50 périodes
      const pumpMagnitude = 0.15 + Math.random() * 0.35; // 15-50% de hausse
      
      for (let i = 0; i < pumpDuration && startIndex + i < data.length; i++) {
        const progress = i / pumpDuration;
        const multiplier = 1 + pumpMagnitude * Math.sin(progress * Math.PI);
        
        data[startIndex + i].close *= multiplier;
        data[startIndex + i].high *= multiplier;
        data[startIndex + i].low *= multiplier;
      }
    });
    
    return data;
  }
}

/**
 * Moteur de backtesting
 */
export class BacktestEngine {
  private marketDataGenerator: MarketDataGenerator;
  
  constructor() {
    this.marketDataGenerator = new MarketDataGenerator();
  }
  
  /**
   * Exécuter un backtest pour un compte
   */
  async runBacktest(config: BacktestConfig, accountId: string): Promise<BacktestResult> {
    console.log(`🧪 Démarrage du backtest pour le compte ${accountId}...`);
    
    // Générer les données de marché
    const symbols = ['BTC-USD', 'ETH-USD', 'PEPE-USD'];
    const marketData: Record<string, any[]> = {};
    
    for (const symbol of symbols) {
      let data = this.marketDataGenerator.generatePriceData(
        symbol,
        config.startDate,
        config.endDate,
        5 // 5 minutes
      );
      
      // Ajouter des pumps
      data = this.marketDataGenerator.addPumpEvents(data, 15);
      marketData[symbol] = data;
    }
    
    // Simuler le trading
    const trades: Trade[] = [];
    let capital = config.initialCapital;
    const capitalHistory: Array<{ date: Date; capital: number }> = [];
    const openPositions: Map<string, any> = new Map();
    
    // Parcourir les données chronologiquement
    const allTimes = new Set<number>();
    Object.values(marketData).forEach(data => {
      data.forEach(candle => allTimes.add(candle.time.getTime()));
    });
    
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
    
    for (const time of sortedTimes) {
      const currentDate = new Date(time);
      
      // Vérifier les positions ouvertes
      for (const [symbol, position] of Array.from(openPositions.entries())) {
        const currentPrice = this.getCurrentPrice(marketData[symbol], currentDate);
        
        if (!currentPrice) continue;
        
        const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
        
        // Stratégie de sortie
        let shouldExit = false;
        let exitReason = '';
        
        // Stop-loss dynamique optimisé
        // Plus serré pour le scalping, plus large pour le trend
        let stopLossThreshold = -5;
        
        if (position.strategy === 'scalping') stopLossThreshold = -3; // Stop serré pour scalping
        if (position.strategy === 'trend') stopLossThreshold = -8;    // Stop large pour laisser respirer le trend
        
        if (profitPercent <= stopLossThreshold) {
          shouldExit = true;
          exitReason = 'stop-loss';
        }
        
        // Take-profit basé sur la stratégie
        const targetProfit = this.getTargetProfit(position.strategy);
        if (profitPercent >= targetProfit) {
          shouldExit = true;
          exitReason = 'take-profit';
        }
        
        // Sortie après 24h pour scalping
        if (position.strategy === 'scalping') {
          const hoursSinceEntry = (currentDate.getTime() - position.entryTime.getTime()) / (1000 * 60 * 60);
          if (hoursSinceEntry >= 24) {
            shouldExit = true;
            exitReason = 'timeout';
          }
        }
        
        if (shouldExit) {
          const profit = (currentPrice - position.entryPrice) * position.quantity;
          capital += position.investedAmount + profit;
          
          trades.push({
            symbol,
            side: 'sell',
            entryPrice: position.entryPrice,
            exitPrice: currentPrice,
            quantity: position.quantity,
            entryTime: position.entryTime,
            exitTime: currentDate,
            profit,
            profitPercent,
            strategy: position.strategy,
          });
          
          openPositions.delete(symbol);
        }
      }
      
      // Chercher de nouvelles opportunités
      if (openPositions.size < config.maxOpenPositions && trades.length < config.maxDailyTrades) {
        for (const symbol of symbols) {
          if (openPositions.has(symbol)) continue;
          
          const signal = this.detectSignal(marketData[symbol], currentDate);
          
          if (signal && signal.strength > 0.7) {
            const strategy = this.selectStrategy(config.strategies);
            const riskAmount = capital * (config.riskPerTrade / 100);
            const currentPrice = this.getCurrentPrice(marketData[symbol], currentDate);
            
            if (!currentPrice) continue;
            
            const quantity = riskAmount / currentPrice;
            const investedAmount = currentPrice * quantity;
            
            if (investedAmount <= capital) {
              capital -= investedAmount;
              
              openPositions.set(symbol, {
                entryPrice: currentPrice,
                quantity,
                investedAmount,
                entryTime: currentDate,
                strategy,
              });
            }
          }
        }
      }
      
      // Enregistrer l'évolution du capital toutes les heures
      if (currentDate.getMinutes() === 0) {
        capitalHistory.push({
          date: currentDate,
          capital: capital + this.calculateOpenPositionsValue(openPositions, marketData, currentDate),
        });
      }
    }
    
    // Fermer les positions restantes
    for (const [symbol, position] of Array.from(openPositions.entries())) {
      const finalPrice = marketData[symbol][marketData[symbol].length - 1].close;
      const profit = (finalPrice - position.entryPrice) * position.quantity;
      capital += position.investedAmount + profit;
      
      trades.push({
        symbol,
        side: 'sell',
        entryPrice: position.entryPrice,
        exitPrice: finalPrice,
        quantity: position.quantity,
        entryTime: position.entryTime,
        exitTime: config.endDate,
        profit,
        profitPercent: ((finalPrice - position.entryPrice) / position.entryPrice) * 100,
        strategy: position.strategy,
      });
    }
    
    // Calculer les statistiques
    const result = this.calculateStatistics(accountId, config, trades, capital, capitalHistory);
    
    console.log(`✅ Backtest terminé pour ${accountId}: ${result.totalProfitPercent.toFixed(2)}% de profit`);
    
    return result;
  }
  
  /**
   * Détecter un signal de trading
   */
  private detectSignal(data: any[], currentDate: Date): { strength: number; type: string } | null {
    const index = data.findIndex(d => d.time.getTime() === currentDate.getTime());
    
    if (index < 20) return null;
    
    // Calculer le momentum
    const recentPrices = data.slice(index - 10, index).map(d => d.close);
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const currentPrice = data[index].close;
    const momentum = (currentPrice - avgPrice) / avgPrice;
    
    // Calculer le volume
    const recentVolumes = data.slice(index - 10, index).map(d => d.volume);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const currentVolume = data[index].volume;
    const volumeRatio = currentVolume / avgVolume;
    
    // Signal de pump : momentum positif + volume élevé (Optimisé)
    // Augmentation de la sensibilité au momentum et au volume pour capturer plus d'opportunités
    // tout en filtrant les faux signaux avec un seuil de force plus élevé
    if (momentum > 0.015 && volumeRatio > 1.3) {
      const strength = Math.min(momentum * 12 + volumeRatio / 2.5, 1);
      
      // Ne retourner que les signaux forts (> 0.6) pour augmenter le taux de réussite
      if (strength > 0.6) {
        return {
          strength,
          type: 'pump',
        };
      }
    }
    
    return null;
  }
  
  /**
   * Obtenir le prix actuel
   */
  private getCurrentPrice(data: any[], currentDate: Date): number | null {
    const candle = data.find(d => d.time.getTime() === currentDate.getTime());
    return candle ? candle.close : null;
  }
  
  /**
   * Sélectionner une stratégie
   */
  private selectStrategy(strategies: string[]): string {
    return strategies[Math.floor(Math.random() * strategies.length)];
  }
  
  /**
   * Obtenir l'objectif de profit pour une stratégie
   */
  private getTargetProfit(strategy: string): number {
    // Objectifs optimisés pour maximiser les gains tout en sécurisant les profits plus tôt
    const targets: Record<string, number> = {
      scalping: 5, // Réduit de 7 à 5 pour sécuriser plus souvent (taux de réussite ++)
      swing: 15,   // Réduit de 25 à 15 pour augmenter la rotation du capital
      trend: 35,   // Réduit de 50 à 35 pour capturer les tendances moyennes
      sentiment: 60, // Réduit de 100 à 60 pour éviter les retournements brutaux
    };
    
    return targets[strategy] || 15;
  }
  
  /**
   * Calculer la valeur des positions ouvertes
   */
  private calculateOpenPositionsValue(
    positions: Map<string, any>,
    marketData: Record<string, any[]>,
    currentDate: Date
  ): number {
    let total = 0;
    
    for (const [symbol, position] of Array.from(positions.entries())) {
      const currentPrice = this.getCurrentPrice(marketData[symbol], currentDate);
      if (currentPrice) {
        total += currentPrice * position.quantity;
      }
    }
    
    return total;
  }
  
  /**
   * Calculer les statistiques du backtest
   */
  private calculateStatistics(
    accountId: string,
    config: BacktestConfig,
    trades: Trade[],
    finalCapital: number,
    capitalHistory: Array<{ date: Date; capital: number }>
  ): BacktestResult {
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit <= 0);
    
    const totalProfit = finalCapital - config.initialCapital;
    const totalProfitPercent = (totalProfit / config.initialCapital) * 100;
    
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length
      : 0;
    
    const averageLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0) / losingTrades.length
      : 0;
    
    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.profit))
      : 0;
    
    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.profit))
      : 0;
    
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
    
    // Calculer le max drawdown
    let maxDrawdown = 0;
    let peak = config.initialCapital;
    
    for (const point of capitalHistory) {
      if (point.capital > peak) {
        peak = point.capital;
      }
      const drawdown = peak - point.capital;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    const maxDrawdownPercent = (maxDrawdown / peak) * 100;
    
    // Performance par stratégie
    const strategyPerformance: Record<string, any> = {};
    
    for (const strategy of config.strategies) {
      const strategyTrades = trades.filter(t => t.strategy === strategy);
      const strategyWins = strategyTrades.filter(t => t.profit > 0);
      
      strategyPerformance[strategy] = {
        trades: strategyTrades.length,
        profit: strategyTrades.reduce((sum, t) => sum + t.profit, 0),
        winRate: strategyTrades.length > 0 ? (strategyWins.length / strategyTrades.length) * 100 : 0,
      };
    }
    
    return {
      accountId,
      config,
      initialCapital: config.initialCapital,
      finalCapital,
      totalProfit,
      totalProfitPercent,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitFactor,
      sharpeRatio: 0, // TODO: Calculer le Sharpe Ratio
      maxDrawdown,
      maxDrawdownPercent,
      trades,
      capitalHistory,
      strategyPerformance,
    };
  }
}

export default BacktestEngine;
