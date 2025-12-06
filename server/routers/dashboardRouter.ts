import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../../drizzle/db';
import { users, positions, botConfigs, coinbaseApiKeys } from '../../drizzle/schema_saas';
import { eq, desc, and } from 'drizzle-orm';
import { getRealAccounts } from '../coinbaseRealClient';
import { Coinbase } from "@coinbase/coinbase-sdk";

// Helper pour déchiffrer les clés API
import { encryptionService } from '../apiKeys/encryptionService';

export const dashboardRouter = router({
  // Récupérer le résumé du compte (Solde, PnL, Statut Bot)
  getSummary: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const userId = ctx.user.id;

    // 1. Récupérer la config du bot
    const botConfig = await db.query.botConfigs.findFirst({
      where: eq(botConfigs.userId, userId),
    });

    // 2. Récupérer les positions ouvertes
    const openPositions = await db.query.positions.findMany({
      where: and(
        eq(positions.userId, userId),
        eq(positions.status, 'open')
      ),
    });

    // 3. Récupérer le solde réel depuis Coinbase
    // Si c'est le propriétaire (admin), on utilise les variables d'env
    // Sinon, on utilise les clés API de l'utilisateur stockées en base
    let totalBalance = 0;
    let currencyBalances: any[] = [];

    try {
      // TODO: Logique pour récupérer les clés API spécifiques de l'utilisateur
      // Pour le MVP, on utilise les clés d'environnement si c'est l'admin
      if (ctx.user.role === 'admin') {
        const accounts = await getRealAccounts();
        currencyBalances = accounts.map((acc: any) => ({
          currency: acc.currency,
          balance: parseFloat(acc.available_balance?.value || '0'),
          hold: parseFloat(acc.hold?.value || '0'),
        })).filter((b: any) => b.balance > 0);
        
        // Estimation simple du total en USD (à améliorer avec des taux de change réels)
        // Ici on suppose que USDC/USD = 1 et on ignore les autres pour le total estimé
        const usdcBalance = currencyBalances.find((b: any) => b.currency === 'USDC' || b.currency === 'USD')?.balance || 0;
        const eurBalance = currencyBalances.find((b: any) => b.currency === 'EUR')?.balance || 0;
        totalBalance = usdcBalance + (eurBalance * 1.08); // Taux fixe pour l'exemple
      }
    } catch (error) {
      console.error("Erreur récupération solde Coinbase:", error);
    }

    // 4. Calculer les performances
    const closedPositions = await db.query.positions.findMany({
      where: and(
        eq(positions.userId, userId),
        eq(positions.status, 'closed')
      ),
    });

    const totalProfit = closedPositions.reduce((acc, pos) => acc + parseFloat(pos.profitLoss || '0'), 0);
    const winRate = closedPositions.length > 0 
      ? (closedPositions.filter((p: any) => parseFloat(p.profitLoss || '0') > 0).length / closedPositions.length) * 100 
      : 0;

    return {
      balance: totalBalance,
      currencyBalances,
      totalProfit,
      winRate,
      activePositionsCount: openPositions.length,
      botStatus: botConfig?.isRunning ? 'active' : 'inactive',
      lastUpdate: new Date(),
    };
  }),

  // Récupérer les positions actives
  getActivePositions: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    return await db.query.positions.findMany({
      where: and(
        eq(positions.userId, ctx.user.id),
        eq(positions.status, 'open')
      ),
      orderBy: [desc(positions.openTime)],
    });
  }),

  // Récupérer l'historique des performances (pour le graphique)
  getPerformanceHistory: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    // Pour le MVP, on génère des points basés sur les trades fermés
    // Idéalement, on aurait une table 'daily_snapshots'
    const trades = await db.query.positions.findMany({
      where: and(
        eq(positions.userId, ctx.user.id),
        eq(positions.status, 'closed')
      ),
      orderBy: [desc(positions.closeTime)],
      limit: 30,
    });

    return trades.map((t: any) => ({
      date: t.closeTime,
      value: parseFloat(t.profitLoss || '0'),
    })).reverse();
  }),
});
