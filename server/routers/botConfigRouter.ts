import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../../drizzle/db';
import { botConfigs, coinbaseApiKeys } from '../../drizzle/schema_saas';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { planLimitsService, PLAN_LIMITS } from '../multiTenant/planLimitsService';

export const botConfigRouter = router({
  // Récupérer la configuration actuelle
  getConfig: protectedProcedure.query(async ({ ctx }: { ctx: any }) => {
    const config = await db.query.botConfigs.findFirst({
      where: eq(botConfigs.userId, ctx.user.id),
    });

    // Si pas de config, retourner une config par défaut
    if (!config) {
      return {
        isRunning: false,
        autoTrade: false,
        paperTrading: true,
        riskPerTrade: 2,
        maxOpenPositions: 3,
        strategies: {
          scalping: false,
          swing: true,
          sentiment: true
        },
        assets: ['BTC', 'ETH', 'SOL']
      };
    }

    return {
      ...config,
      strategies: typeof config.strategies === 'string' ? JSON.parse(config.strategies) : config.strategies,
    };
  }),

  // Mettre à jour la configuration
  updateConfig: protectedProcedure
    .input(z.object({
      autoTrade: z.boolean(),
      paperTrading: z.boolean(),
      riskPerTrade: z.number().min(0.1).max(10),
      maxOpenPositions: z.number().min(1).max(10),
      strategies: z.object({
        scalping: z.boolean(),
        swing: z.boolean(),
        sentiment: z.boolean()
      }),
      assets: z.array(z.string()).min(1)
    }))
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      const userId = ctx.user.id;
      const userPlan = await planLimitsService.getUserPlan(userId);
      const limits = PLAN_LIMITS[userPlan];

      // Vérification des limites du plan
      if (input.strategies.sentiment && !limits.allowSentimentAnalysis) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `L'analyse de sentiment est réservée aux plans Pro et Enterprise. Votre plan actuel : ${userPlan}`,
        });
      }

      if (input.maxOpenPositions > limits.maxOpenPositions) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Votre plan ${userPlan} est limité à ${limits.maxOpenPositions} positions simultanées.`,
        });
      }

      // Vérifier si une config existe déjà
      const existingConfig = await db.query.botConfigs.findFirst({
        where: eq(botConfigs.userId, userId),
      });

      if (existingConfig) {
        // Mise à jour
        await db.update(botConfigs)
          .set({
            autoTrade: input.autoTrade,
            paperTrading: input.paperTrading,
            riskPerTrade: input.riskPerTrade.toString(),
            maxOpenPositions: input.maxOpenPositions,
            strategies: JSON.stringify(input.strategies),
            updatedAt: new Date(),
          })
          .where(eq(botConfigs.id, existingConfig.id));
      } else {
        // Création
        await db.insert(botConfigs).values({
          id: uuidv4(),
          userId,
          autoTrade: input.autoTrade,
          paperTrading: input.paperTrading,
          riskPerTrade: input.riskPerTrade.toString(),
          maxOpenPositions: input.maxOpenPositions,
          strategies: JSON.stringify(input.strategies),
        });
      }

      return { success: true };
    }),

  // Démarrer/Arrêter le bot
  toggleBot: protectedProcedure
    .input(z.object({ isRunning: z.boolean() }))
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      const userId = ctx.user.id;

      // Vérifier si l'utilisateur a une clé API valide avant d'activer
      if (input.isRunning) {
        const apiKey = await db.query.coinbaseApiKeys.findFirst({
          where: eq(coinbaseApiKeys.userId, userId),
        });

        if (!apiKey || !apiKey.isValid) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Vous devez connecter une clé API Coinbase valide avant d\'activer le bot.',
          });
        }
      }

      await db.update(botConfigs)
        .set({
          isRunning: input.isRunning,
          startedAt: input.isRunning ? new Date() : null,
          stoppedAt: input.isRunning ? null : new Date(),
        })
        .where(eq(botConfigs.userId, userId));

      return { success: true, status: input.isRunning ? 'active' : 'inactive' };
    }),
});
