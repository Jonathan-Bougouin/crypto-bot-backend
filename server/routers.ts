import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  market: router({
    prices: publicProcedure.query(async () => {
      const { getCurrentPrices } = await import("./polygonService");
      return await getCurrentPrices();
    }),
    coinPrice: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getCoinPrice } = await import("./polygonService");
        return await getCoinPrice(input.symbol);
      }),
    ohlc: publicProcedure
      .input(z.object({ symbol: z.string(), days: z.number().default(7) }))
      .query(async ({ input }) => {
        const { getOHLCData } = await import("./polygonService");
        return await getOHLCData(input.symbol, input.days);
      }),
  }),

  alerts: router({
    list: publicProcedure.query(async () => {
      const { getRecentAlerts } = await import("./db");
      const alerts = await getRecentAlerts(50);
      return alerts.map(alert => ({
        ...alert,
        indicatorsTriggered: JSON.parse(alert.indicatorsTriggered)
      }));
    }),
    byAsset: publicProcedure
      .input(z.object({ asset: z.string() }))
      .query(async ({ input }) => {
        const { getAlertsByAsset } = await import("./db");
        const alerts = await getAlertsByAsset(input.asset, 50);
        return alerts.map(alert => ({
          ...alert,
          indicatorsTriggered: JSON.parse(alert.indicatorsTriggered)
        }));
      }),
    generate: publicProcedure.mutation(async () => {
      // Appel du script Python pour générer des alertes avec les vraies données
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      try {
        const { stdout, stderr } = await execAsync(
          "python3 server/generate_real_alerts.py",
          { cwd: process.cwd(), timeout: 30000 }
        );
        console.log(stdout);
        if (stderr) console.error(stderr);
        return { success: true, message: "Alertes générées avec succès (données temps réel)" };
      } catch (error) {
        console.error("Erreur lors de la génération d'alertes:", error);
        return { success: false, message: "Erreur lors de la génération d'alertes" };
      }
    }),
  }),

  trading: router({
    // Récupérer les soldes du compte
    balances: publicProcedure.query(async () => {
      const { getAccountBalances } = await import("./coinbaseService");
      return await getAccountBalances();
    }),
    // Récupérer le prix actuel d'un symbole
    price: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getCurrentPrice } = await import("./coinbaseService");
        return await getCurrentPrice(input.symbol);
      }),
    // Placer un ordre de trading
    placeOrder: publicProcedure
      .input(z.object({
        symbol: z.string(),
        side: z.enum(["buy", "sell"]),
        amount: z.number().positive(),
        price: z.number().positive().optional(),
        type: z.enum(["market", "limit"]),
        paperTrading: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const { placeOrder, validateOrder } = await import("./coinbaseService");
        const { getAccountBalances } = await import("./coinbaseService");
        
        // Récupérer le solde disponible
        const balances = await getAccountBalances();
        const eurBalance = balances.find(b => b.currency === "EUR");
        const availableBalance = parseFloat(eurBalance?.available || "0");
        
        // Valider l'ordre
        const validation = validateOrder(input, availableBalance);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        // Placer l'ordre
        const result = await placeOrder(input, input.paperTrading);
        
        // Si l'ordre est complété, enregistrer le trade dans la base de données
        if (result.status === "completed") {
          const { createTrade } = await import("./db");
          await createTrade({
            asset: input.symbol,
            entryPrice: result.price.toString(),
            quantity: result.amount.toString(),
            status: "open",
            entryTime: new Date(result.timestamp),
          });
        }
        
        return result;
      }),
    // Calculer le montant maximum d'achat
    maxBuyAmount: publicProcedure
      .input(z.object({ symbol: z.string(), balance: z.number() }))
      .query(async ({ input }) => {
        const { calculateMaxBuyAmount } = await import("./coinbaseService");
        return await calculateMaxBuyAmount(input.symbol, input.balance);
      }),
  }),

  paperTrading: router({
    // Récupérer le portefeuille Paper Trading
    portfolio: publicProcedure.query(async () => {
      const { getPaperPortfolio } = await import("./paperTradingService");
      return getPaperPortfolio();
    }),
    // Réinitialiser le portefeuille Paper Trading
    reset: publicProcedure
      .input(z.object({ initialCash: z.number().positive().default(50) }))
      .mutation(async ({ input }) => {
        const { resetPaperPortfolio } = await import("./paperTradingService");
        return resetPaperPortfolio(input.initialCash);
      }),
    // Calculer la valeur du portefeuille
    value: publicProcedure
      .input(z.object({
        prices: z.record(z.string(), z.number()),
      }))
      .query(async ({ input }) => {
        const { calculatePaperPortfolioValue } = await import("./paperTradingService");
        return await calculatePaperPortfolioValue(input.prices);
      }),
    // Obtenir l'historique des trades
    history: publicProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        const { getPaperTradeHistory } = await import("./paperTradingService");
        return getPaperTradeHistory(input.limit);
      }),
    // Obtenir les statistiques
    stats: publicProcedure.query(async () => {
      const { getPaperTradingStats } = await import("./paperTradingService");
      return getPaperTradingStats();
    }),
  }),

  trades: router({
    list: publicProcedure.query(async () => {
      const { getAllTrades } = await import("./db");
      return await getAllTrades(100);
    }),
    byAsset: publicProcedure
      .input(z.object({ asset: z.string() }))
      .query(async ({ input }) => {
        const { getTradesByAsset } = await import("./db");
        return await getTradesByAsset(input.asset, 100);
      }),
    closed: publicProcedure.query(async () => {
      const { getClosedTrades } = await import("./db");
      return await getClosedTrades(100);
    }),
    generateTest: publicProcedure.mutation(async () => {
      // Générer des trades de test réalistes
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      
      try {
        const { stdout, stderr } = await execAsync(
          "python3 server/generate_test_trades.py",
          { cwd: process.cwd(), timeout: 30000 }
        );
        console.log(stdout);
        if (stderr) console.error(stderr);
        return { success: true, message: "Trades de test générés avec succès" };
      } catch (error) {
        console.error("Erreur lors de la génération de trades de test:", error);
        return { success: false, message: "Erreur lors de la génération de trades de test" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
