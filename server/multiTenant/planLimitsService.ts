import { db } from '../../drizzle/db';
import { users, subscriptions, botConfigs } from '../../drizzle/schema_saas';
import { eq } from 'drizzle-orm';

export type PlanType = 'starter' | 'pro' | 'enterprise';

export const PLAN_LIMITS = {
  starter: {
    maxDailyTrades: 10,
    maxOpenPositions: 3,
    allowRealTrading: true,
    allowSentimentAnalysis: false,
    allowCustomStrategies: false,
    supportLevel: 'email'
  },
  pro: {
    maxDailyTrades: 50,
    maxOpenPositions: 10,
    allowRealTrading: true,
    allowSentimentAnalysis: true,
    allowCustomStrategies: true,
    supportLevel: 'priority'
  },
  enterprise: {
    maxDailyTrades: 9999,
    maxOpenPositions: 9999,
    allowRealTrading: true,
    allowSentimentAnalysis: true,
    allowCustomStrategies: true,
    supportLevel: 'dedicated'
  }
};

export class PlanLimitsService {
  /**
   * Récupérer le plan actuel d'un utilisateur
   */
  async getUserPlan(userId: string): Promise<PlanType> {
    // 1. Vérifier l'abonnement actif
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (subscription && subscription.status === 'active') {
      return subscription.plan as PlanType;
    }

    // 2. Vérifier le plan stocké sur l'utilisateur (fallback ou admin)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (user?.role === 'admin') return 'enterprise';
    
    return (user?.subscriptionPlan as PlanType) || 'starter';
  }

  /**
   * Vérifier si l'utilisateur peut effectuer une action
   */
  async checkLimit(userId: string, feature: keyof typeof PLAN_LIMITS['starter']): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan];
    
    return !!limits[feature];
  }

  /**
   * Vérifier si l'utilisateur a atteint sa limite de trades quotidiens
   */
  async checkDailyTradeLimit(userId: string, currentTradesCount: number): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limit = PLAN_LIMITS[plan].maxDailyTrades;
    
    return currentTradesCount < limit;
  }
}

export const planLimitsService = new PlanLimitsService();
