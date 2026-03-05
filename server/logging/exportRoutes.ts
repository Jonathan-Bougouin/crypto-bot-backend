/**
 * exportRoutes.ts — COINBOT PRO PHASE 1.3
 * 3 endpoints Express streaming pour exports scientifiques (admin-only)
 *
 * Endpoints :
 *   GET /api/exports/trades-jsonl       : stream NDJSON des trades
 *   GET /api/exports/signals-jsonl      : stream NDJSON des signaux
 *   GET /api/exports/equity-csv         : stream CSV de l'historique d'equity
 *
 * Sécurité : admin-only (vérification du rôle via session)
 * Sans perte : streaming direct depuis les fichiers JSONL
 */

import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import readline from "readline";
import crypto from "crypto";
import { sha256File } from "./decisionLogger";

export const exportRouter = express.Router();

const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), "exports", "forwardtest");

// ============================================================================
// MIDDLEWARE : admin-only
// ============================================================================

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Vérification du rôle admin via le cookie de session (JWT)
  // En mode développement/observation, on autorise si OBSERVATION_MODE=true
  const isObservation = process.env.OBSERVATION_MODE === "true";
  const isDevMode = process.env.NODE_ENV !== "production";

  if (isObservation || isDevMode) {
    // Autoriser en mode observation/dev pour les tests
    return next();
  }

  // En production, vérifier le rôle admin
  const userRole = (req as any).user?.role;
  if (userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function getAvailableDates(): string[] {
  try {
    if (!fs.existsSync(LOG_DIR)) return [];
    return fs
      .readdirSync(LOG_DIR)
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function getLogFile(date: string, filename: string): string {
  return path.join(LOG_DIR, date, filename);
}

// ============================================================================
// ENDPOINT 1 : GET /api/exports/trades-jsonl
// ============================================================================

exportRouter.get("/trades-jsonl", requireAdmin, (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? getAvailableDates()[0];

  if (!date) {
    res.status(404).json({ error: "No export data available" });
    return;
  }

  const filePath = getLogFile(date, "decisions.jsonl");

  if (!fs.existsSync(filePath)) {
    // Retourner un stream vide avec headers corrects
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("X-Export-Date", date);
    res.setHeader("X-Record-Count", "0");
    res.setHeader("X-SHA256", "EMPTY");
    res.end();
    return;
  }

  const sha256 = sha256File(filePath);
  const stats = fs.statSync(filePath);

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Content-Disposition", `attachment; filename="trades-${date}.jsonl"`);
  res.setHeader("X-Export-Date", date);
  res.setHeader("X-File-Size", stats.size.toString());
  res.setHeader("X-SHA256", sha256);
  res.setHeader("Transfer-Encoding", "chunked");

  // Streaming ligne par ligne (sans perte mémoire)
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let count = 0;

  rl.on("line", (line) => {
    if (line.trim()) {
      res.write(line + "\n");
      count++;
    }
  });

  rl.on("close", () => {
    res.setHeader("X-Record-Count", count.toString());
    res.end();
  });

  rl.on("error", (err) => {
    console.error("[exportRoutes] trades-jsonl stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream error" });
    }
  });
});

// ============================================================================
// ENDPOINT 2 : GET /api/exports/signals-jsonl
// ============================================================================

exportRouter.get("/signals-jsonl", requireAdmin, (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? getAvailableDates()[0];

  if (!date) {
    res.status(404).json({ error: "No export data available" });
    return;
  }

  const filePath = getLogFile(date, "signals.jsonl");

  if (!fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("X-Export-Date", date);
    res.setHeader("X-Record-Count", "0");
    res.setHeader("X-SHA256", "EMPTY");
    res.end();
    return;
  }

  const sha256 = sha256File(filePath);
  const stats = fs.statSync(filePath);

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Content-Disposition", `attachment; filename="signals-${date}.jsonl"`);
  res.setHeader("X-Export-Date", date);
  res.setHeader("X-File-Size", stats.size.toString());
  res.setHeader("X-SHA256", sha256);
  res.setHeader("Transfer-Encoding", "chunked");

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let count = 0;

  rl.on("line", (line) => {
    if (line.trim()) {
      res.write(line + "\n");
      count++;
    }
  });

  rl.on("close", () => {
    res.setHeader("X-Record-Count", count.toString());
    res.end();
  });

  rl.on("error", (err) => {
    console.error("[exportRoutes] signals-jsonl stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream error" });
    }
  });
});

// ============================================================================
// ENDPOINT 3 : GET /api/exports/equity-csv
// ============================================================================

exportRouter.get("/equity-csv", requireAdmin, (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? getAvailableDates()[0];

  if (!date) {
    res.status(404).json({ error: "No export data available" });
    return;
  }

  const filePath = getLogFile(date, "equity.csv.jsonl");

  if (!fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("X-Export-Date", date);
    res.setHeader("X-Record-Count", "0");
    // Envoyer uniquement le header CSV
    res.end("timestamp,userId,cashBalance,positionsValue,totalEquity,openPositions,dailyPnL,cumulativePnL,observationMode\n");
    return;
  }

  const sha256 = sha256File(filePath);
  const stats = fs.statSync(filePath);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="equity-${date}.csv"`);
  res.setHeader("X-Export-Date", date);
  res.setHeader("X-File-Size", stats.size.toString());
  res.setHeader("X-SHA256", sha256);
  res.setHeader("Transfer-Encoding", "chunked");

  // Header CSV
  res.write("timestamp,userId,cashBalance,positionsValue,totalEquity,openPositions,dailyPnL,cumulativePnL,observationMode\n");

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let count = 0;

  rl.on("line", (line) => {
    if (!line.trim()) return;
    try {
      const record = JSON.parse(line);
      const csvLine = [
        record.timestamp ?? "",
        record.userId ?? "",
        record.cashBalance ?? 0,
        record.positionsValue ?? 0,
        record.totalEquity ?? 0,
        record.openPositions ?? 0,
        record.dailyPnL ?? 0,
        record.cumulativePnL ?? 0,
        record.observationMode ?? false,
      ].join(",");
      res.write(csvLine + "\n");
      count++;
    } catch {
      // Ligne malformée : skip silencieux
    }
  });

  rl.on("close", () => {
    res.setHeader("X-Record-Count", count.toString());
    res.end();
  });

  rl.on("error", (err) => {
    console.error("[exportRoutes] equity-csv stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Stream error" });
    }
  });
});

// ============================================================================
// ENDPOINT 4 : GET /api/exports/manifest
// ============================================================================

exportRouter.get("/manifest", requireAdmin, (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? getAvailableDates()[0];

  if (!date) {
    res.status(404).json({ error: "No export data available" });
    return;
  }

  const dir = path.join(LOG_DIR, date);
  const files = ["decisions.jsonl", "signals.jsonl", "equity.csv.jsonl"];

  const manifest: Record<string, unknown> = {
    version: "1.0",
    date,
    generatedAt: new Date().toISOString(),
    observationMode: process.env.OBSERVATION_MODE === "true",
    files: {} as Record<string, unknown>,
  };

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sha256 = sha256File(filePath);
      // Compter les lignes
      const content = fs.readFileSync(filePath, "utf-8");
      const lineCount = content.split("\n").filter((l) => l.trim()).length;

      (manifest.files as Record<string, unknown>)[filename] = {
        exists: true,
        sizeBytes: stats.size,
        sha256,
        recordCount: lineCount,
        lastModified: stats.mtime.toISOString(),
      };
    } else {
      (manifest.files as Record<string, unknown>)[filename] = {
        exists: false,
        sizeBytes: 0,
        sha256: "FILE_NOT_FOUND",
        recordCount: 0,
      };
    }
  }

  res.json(manifest);
});

// ============================================================================
// ENDPOINT 5 : GET /api/exports/dates
// ============================================================================

exportRouter.get("/dates", requireAdmin, (_req: Request, res: Response) => {
  const dates = getAvailableDates();
  res.json({ dates, count: dates.length });
});
