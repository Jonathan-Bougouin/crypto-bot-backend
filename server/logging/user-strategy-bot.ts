/**
 * user-strategy-bot.ts — COINBOT PRO PHASE 1.2 / 1.3
 * Bot de stratégie utilisateur avec injections de logging scientifique
 *
 * Ce module étend l'AutonomousBot avec 4 injections de logging :
 *   1. logDecision() à chaque décision BUY/SELL/HOLD/REJECT
 *   2. logEquity()   à chaque cycle d'évaluation du portefeuille
 *   3. logSignal()   à chaque signal technique calculé
 *   4. flushLogs()   à l'arrêt du bot
 *
 * OBSERVATION_MODE=true : logging sans exécution de trades réels
 */

import { logDecision, logEquity, logSignal, flushLogs, isObservationMode } from "./decisionLogger";

// ============================================================================
// INTERFACES
// ============================================================================

export interface UserStrategyConfig {
  userId: string;
  capital: number;
  assets: string[];
  riskPerTrade: number; // % du capital
  targetProfit: number; // % de gain cible
  maxDailyTrades: number;
  observationMode?: boolean;
}

export interface MarketSnapshot {
  asset: string;
  price: number;
  rsi: number;
  macd: number;
  ema20: number;
  ema50: number;
  volume24h: number;
  priceChange24h: number;
}

export interface StrategyDecision {
  action: "BUY" | "SELL" | "HOLD" | "REJECT";
  asset: string;
  price: number;
  quantity: number;
  confidence: number;
  reason: string;
  rejectReason?: string;
}

// ============================================================================
// CLASSE UserStrategyBot
// ============================================================================

export class UserStrategyBot {
  private config: UserStrategyConfig;
  private dailyTrades: number = 0;
  private currentEquity: number;
  private positions: Map<string, { quantity: number; entryPrice: number }> = new Map();
  private isRunning: boolean = false;
  private cycleInterval?: NodeJS.Timeout;

  constructor(config: UserStrategyConfig) {
    this.config = config;
    this.currentEquity = config.capital;
  }

  // ============================================================================
  // INJECTION 1 : Évaluation des signaux techniques
  // ============================================================================

  private evaluateSignals(snapshot: MarketSnapshot): void {
    // INJECTION logSignal — RSI
    logSignal({
      userId: this.config.userId,
      asset: snapshot.asset,
      signalType: "RSI",
      value: snapshot.rsi,
      threshold: 30,
      triggered: snapshot.rsi < 30 || snapshot.rsi > 70,
      timeframe: "1h",
    });

    // INJECTION logSignal — MACD
    logSignal({
      userId: this.config.userId,
      asset: snapshot.asset,
      signalType: "MACD",
      value: snapshot.macd,
      threshold: 0,
      triggered: snapshot.macd > 0,
      timeframe: "1h",
    });

    // INJECTION logSignal — EMA Cross
    const emaCross = snapshot.ema20 > snapshot.ema50;
    logSignal({
      userId: this.config.userId,
      asset: snapshot.asset,
      signalType: "EMA_CROSS",
      value: snapshot.ema20 - snapshot.ema50,
      threshold: 0,
      triggered: emaCross,
      timeframe: "4h",
    });
  }

  // ============================================================================
  // INJECTION 2 : Prise de décision avec logging
  // ============================================================================

  private makeDecision(snapshot: MarketSnapshot): StrategyDecision {
    const portfolioValueBefore = this.currentEquity;

    // Règles de la stratégie
    const isBullish = snapshot.rsi < 35 && snapshot.macd > 0 && snapshot.ema20 > snapshot.ema50;
    const isBearish = snapshot.rsi > 70 && snapshot.macd < 0;
    const hasPosition = this.positions.has(snapshot.asset);

    let decision: StrategyDecision;

    // Vérification des limites
    if (this.dailyTrades >= this.config.maxDailyTrades) {
      decision = {
        action: "REJECT",
        asset: snapshot.asset,
        price: snapshot.price,
        quantity: 0,
        confidence: 1.0,
        reason: "Daily trade limit reached",
        rejectReason: `MAX_DAILY_TRADES (${this.config.maxDailyTrades})`,
      };
    } else if (isBullish && !hasPosition) {
      const investAmount = this.currentEquity * (this.config.riskPerTrade / 100);
      const quantity = investAmount / snapshot.price;
      const confidence = Math.min(0.95, (35 - snapshot.rsi) / 35 + snapshot.macd * 0.1);

      decision = {
        action: "BUY",
        asset: snapshot.asset,
        price: snapshot.price,
        quantity,
        confidence: Math.max(0.5, confidence),
        reason: `RSI oversold (${snapshot.rsi.toFixed(1)}), MACD positive, EMA bullish cross`,
      };
    } else if (isBearish && hasPosition) {
      const position = this.positions.get(snapshot.asset)!;
      const confidence = Math.min(0.95, (snapshot.rsi - 70) / 30);

      decision = {
        action: "SELL",
        asset: snapshot.asset,
        price: snapshot.price,
        quantity: position.quantity,
        confidence: Math.max(0.5, confidence),
        reason: `RSI overbought (${snapshot.rsi.toFixed(1)}), MACD negative`,
      };
    } else {
      decision = {
        action: "HOLD",
        asset: snapshot.asset,
        price: snapshot.price,
        quantity: 0,
        confidence: 0.6,
        reason: `No clear signal — RSI: ${snapshot.rsi.toFixed(1)}, MACD: ${snapshot.macd.toFixed(4)}`,
      };
    }

    // INJECTION logDecision
    logDecision({
      userId: this.config.userId,
      asset: decision.asset,
      action: decision.action,
      price: decision.price,
      quantity: decision.quantity,
      confidence: decision.confidence,
      reason: decision.reason,
      rejectReason: decision.rejectReason,
      portfolioValueBefore,
      indicators: {
        rsi: snapshot.rsi,
        macd: snapshot.macd,
        ema20: snapshot.ema20,
        ema50: snapshot.ema50,
        volume24h: snapshot.volume24h,
        priceChange24h: snapshot.priceChange24h,
      },
    });

    return decision;
  }

  // ============================================================================
  // INJECTION 3 : Mise à jour de l'equity
  // ============================================================================

  private updateEquity(snapshots: MarketSnapshot[]): void {
    let positionsValue = 0;

    for (const [asset, position] of this.positions.entries()) {
      const snapshot = snapshots.find((s) => s.asset === asset);
      if (snapshot) {
        positionsValue += position.quantity * snapshot.price;
      }
    }

    const totalEquity = this.currentEquity + positionsValue;
    const initialCapital = this.config.capital;
    const cumulativePnL = totalEquity - initialCapital;

    // INJECTION logEquity
    logEquity({
      userId: this.config.userId,
      cashBalance: this.currentEquity,
      positionsValue,
      totalEquity,
      openPositions: this.positions.size,
      dailyPnL: 0, // Calculé sur la journée complète
      cumulativePnL,
    });
  }

  // ============================================================================
  // EXÉCUTION D'UN CYCLE
  // ============================================================================

  async runCycle(snapshots: MarketSnapshot[]): Promise<StrategyDecision[]> {
    const decisions: StrategyDecision[] = [];

    for (const snapshot of snapshots) {
      // Évaluer les signaux
      this.evaluateSignals(snapshot);

      // Prendre une décision
      const decision = this.makeDecision(snapshot);
      decisions.push(decision);

      // Exécuter (sauf en OBSERVATION_MODE)
      if (!isObservationMode()) {
        this.executeDecision(decision);
      }
    }

    // Mettre à jour l'equity après le cycle
    this.updateEquity(snapshots);

    return decisions;
  }

  // ============================================================================
  // EXÉCUTION DE LA DÉCISION (hors OBSERVATION_MODE)
  // ============================================================================

  private executeDecision(decision: StrategyDecision): void {
    if (decision.action === "BUY") {
      const cost = decision.price * decision.quantity;
      if (cost <= this.currentEquity) {
        this.currentEquity -= cost;
        this.positions.set(decision.asset, {
          quantity: decision.quantity,
          entryPrice: decision.price,
        });
        this.dailyTrades++;
        console.log(`[UserStrategyBot] BUY ${decision.asset} @ ${decision.price} x${decision.quantity.toFixed(6)}`);
      }
    } else if (decision.action === "SELL") {
      const position = this.positions.get(decision.asset);
      if (position) {
        const proceeds = decision.price * position.quantity;
        this.currentEquity += proceeds;
        this.positions.delete(decision.asset);
        this.dailyTrades++;
        console.log(`[UserStrategyBot] SELL ${decision.asset} @ ${decision.price} x${position.quantity.toFixed(6)}`);
      }
    }
  }

  // ============================================================================
  // DÉMARRAGE / ARRÊT
  // ============================================================================

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[UserStrategyBot] Démarré — userId: ${this.config.userId} — OBSERVATION_MODE: ${isObservationMode()}`);
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = undefined;
    }

    // INJECTION flushLogs à l'arrêt
    flushLogs();
    console.log(`[UserStrategyBot] Arrêté — logs flushés`);
  }

  getStatus(): { isRunning: boolean; equity: number; positions: number; dailyTrades: number } {
    return {
      isRunning: this.isRunning,
      equity: this.currentEquity,
      positions: this.positions.size,
      dailyTrades: this.dailyTrades,
    };
  }
}
