/**
 * decisionLogger.ts — COINBOT PRO PHASE 1.2
 * Logging scientifique des décisions du bot de trading
 *
 * Fonctions exportées :
 *   - logDecision()      : enregistre une décision de trading (BUY/SELL/HOLD/REJECT)
 *   - logEquity()        : enregistre un snapshot d'equity
 *   - logSignal()        : enregistre un signal technique brut
 *   - flushLogs()        : force l'écriture des logs en attente
 *
 * Validation : Zod v4
 * Fail-soft  : toute erreur de logging est capturée sans interrompre le bot
 */

import { z } from "zod";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

export const DecisionSchema = z.object({
  timestamp: z.string().datetime(),
  userId: z.string().min(1),
  asset: z.string().min(1),
  action: z.enum(["BUY", "SELL", "HOLD", "REJECT"]),
  confidence: z.number().min(0).max(1),
  price: z.number().positive(),
  quantity: z.number().nonnegative(),
  reason: z.string(),
  indicators: z.record(z.string(), z.unknown()).optional(),
  strategyId: z.string().optional(),
  rejectReason: z.string().optional(),
  portfolioValueBefore: z.number().nonnegative().optional(),
  portfolioValueAfter: z.number().nonnegative().optional(),
  observationMode: z.boolean().default(false),
});

export const EquitySnapshotSchema = z.object({
  timestamp: z.string().datetime(),
  userId: z.string().min(1),
  cashBalance: z.number().nonnegative(),
  positionsValue: z.number().nonnegative(),
  totalEquity: z.number().nonnegative(),
  openPositions: z.number().int().nonnegative(),
  dailyPnL: z.number(),
  cumulativePnL: z.number(),
  observationMode: z.boolean().default(false),
});

export const SignalSchema = z.object({
  timestamp: z.string().datetime(),
  userId: z.string().min(1),
  asset: z.string().min(1),
  signalType: z.string(),
  value: z.number(),
  threshold: z.number().optional(),
  triggered: z.boolean(),
  timeframe: z.string().optional(),
  observationMode: z.boolean().default(false),
});

export type Decision = z.infer<typeof DecisionSchema>;
export type EquitySnapshot = z.infer<typeof EquitySnapshotSchema>;
export type Signal = z.infer<typeof SignalSchema>;

// ============================================================================
// CONFIGURATION
// ============================================================================

const OBSERVATION_MODE = process.env.OBSERVATION_MODE === "true";
const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), "exports", "forwardtest");

// Buffers en mémoire (flush périodique)
const decisionBuffer: Decision[] = [];
const equityBuffer: EquitySnapshot[] = [];
const signalBuffer: Signal[] = [];

let flushTimer: NodeJS.Timeout | null = null;

function getDateDir(): string {
  const today = new Date().toISOString().split("T")[0];
  const dir = path.join(LOG_DIR, today);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function appendJsonl(filePath: string, record: object): void {
  const line = JSON.stringify(record) + "\n";
  fs.appendFileSync(filePath, line, "utf-8");
}

// ============================================================================
// FONCTION 1 : logDecision
// ============================================================================

/**
 * Enregistre une décision de trading du bot.
 * Fail-soft : ne lève jamais d'exception.
 */
export function logDecision(raw: Partial<Decision> & { asset: string; action: string; price: number; userId: string }): void {
  try {
    const record = DecisionSchema.parse({
      timestamp: new Date().toISOString(),
      quantity: 0,
      reason: "",
      confidence: 0,
      ...raw,
      observationMode: OBSERVATION_MODE,
    });

    decisionBuffer.push(record);

    // Écriture immédiate en mode observation pour ne perdre aucun signal
    if (OBSERVATION_MODE) {
      const dir = getDateDir();
      appendJsonl(path.join(dir, "decisions.jsonl"), record);
    }

    scheduleFlush();
  } catch (err) {
    console.warn("[decisionLogger] logDecision fail-soft:", err instanceof Error ? err.message : err);
  }
}

// ============================================================================
// FONCTION 2 : logEquity
// ============================================================================

/**
 * Enregistre un snapshot d'equity (état du portefeuille à un instant T).
 * Fail-soft : ne lève jamais d'exception.
 */
export function logEquity(raw: Partial<EquitySnapshot> & { userId: string; cashBalance: number; totalEquity: number }): void {
  try {
    const record = EquitySnapshotSchema.parse({
      timestamp: new Date().toISOString(),
      positionsValue: 0,
      openPositions: 0,
      dailyPnL: 0,
      cumulativePnL: 0,
      ...raw,
      observationMode: OBSERVATION_MODE,
    });

    equityBuffer.push(record);

    if (OBSERVATION_MODE) {
      const dir = getDateDir();
      appendJsonl(path.join(dir, "equity.csv.jsonl"), record);
    }

    scheduleFlush();
  } catch (err) {
    console.warn("[decisionLogger] logEquity fail-soft:", err instanceof Error ? err.message : err);
  }
}

// ============================================================================
// FONCTION 3 : logSignal
// ============================================================================

/**
 * Enregistre un signal technique brut (RSI, MACD, EMA, etc.).
 * Fail-soft : ne lève jamais d'exception.
 */
export function logSignal(raw: Partial<Signal> & { userId: string; asset: string; signalType: string; value: number; triggered: boolean }): void {
  try {
    const record = SignalSchema.parse({
      timestamp: new Date().toISOString(),
      ...raw,
      observationMode: OBSERVATION_MODE,
    });

    signalBuffer.push(record);

    if (OBSERVATION_MODE) {
      const dir = getDateDir();
      appendJsonl(path.join(dir, "signals.jsonl"), record);
    }

    scheduleFlush();
  } catch (err) {
    console.warn("[decisionLogger] logSignal fail-soft:", err instanceof Error ? err.message : err);
  }
}

// ============================================================================
// FONCTION 4 : flushLogs
// ============================================================================

/**
 * Force l'écriture de tous les buffers en mémoire sur disque.
 * Appelé périodiquement (toutes les 60s) et à l'arrêt du serveur.
 */
export function flushLogs(): void {
  try {
    if (decisionBuffer.length === 0 && equityBuffer.length === 0 && signalBuffer.length === 0) {
      return;
    }

    const dir = getDateDir();

    if (decisionBuffer.length > 0) {
      const filePath = path.join(dir, "decisions.jsonl");
      for (const record of decisionBuffer) {
        appendJsonl(filePath, record);
      }
      decisionBuffer.length = 0;
    }

    if (equityBuffer.length > 0) {
      const filePath = path.join(dir, "equity.csv.jsonl");
      for (const record of equityBuffer) {
        appendJsonl(filePath, record);
      }
      equityBuffer.length = 0;
    }

    if (signalBuffer.length > 0) {
      const filePath = path.join(dir, "signals.jsonl");
      for (const record of signalBuffer) {
        appendJsonl(filePath, record);
      }
      signalBuffer.length = 0;
    }

    console.log(`[decisionLogger] Flush OK — ${new Date().toISOString()}`);
  } catch (err) {
    console.warn("[decisionLogger] flushLogs fail-soft:", err instanceof Error ? err.message : err);
  }
}

// ============================================================================
// FLUSH PÉRIODIQUE
// ============================================================================

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushLogs();
    flushTimer = null;
  }, 60_000); // flush toutes les 60 secondes
}

// Flush à l'arrêt du processus
process.on("exit", flushLogs);
process.on("SIGTERM", () => { flushLogs(); process.exit(0); });
process.on("SIGINT", () => { flushLogs(); process.exit(0); });

// ============================================================================
// UTILITAIRES EXPORT
// ============================================================================

/**
 * Calcule le SHA256 d'un fichier (pour manifest.json)
 */
export function sha256File(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return "FILE_NOT_FOUND";
  }
}

/**
 * Retourne le mode d'observation actuel
 */
export function isObservationMode(): boolean {
  return OBSERVATION_MODE;
}
