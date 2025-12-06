/**
 * Schéma de base de données pour la plateforme SaaS multi-tenant (MySQL)
 */

import { mysqlTable, text, int, timestamp, boolean, decimal, varchar, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// UTILISATEURS
// ============================================================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID stocké en varchar(36)
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  
  // Profil
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
  
  // Abonnement
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('none'), // 'active', 'canceled', etc.
  subscriptionPlan: varchar('subscription_plan', { length: 50 }), // 'starter', 'pro', 'enterprise'
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  trialEndsAt: timestamp('trial_ends_at'),
  
  // Facturation Stripe
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  billingEmail: varchar('billing_email', { length: 255 }),
  
  // Statut
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  role: varchar('role', { length: 20 }).default('user'), // 'user', 'admin'
  
  // Réinitialisation de mot de passe
  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordExpires: timestamp('reset_password_expires'),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  stripeCustomerIdx: index('stripe_customer_idx').on(table.stripeCustomerId),
}));

// ============================================================================
// CLÉS API COINBASE
// ============================================================================

export const coinbaseApiKeys = mysqlTable('coinbase_api_keys', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(), // Pas de FK contrainte stricte pour simplifier, géré par l'app
  
  // Clés chiffrées (AES-256-GCM)
  apiKeyId: text('api_key_id').notNull(), // Chiffré
  apiSecret: text('api_secret').notNull(), // Chiffré
  
  // Métadonnées
  nickname: varchar('nickname', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsed: timestamp('last_used'),
  
  // Validation
  isValid: boolean('is_valid').default(false),
  lastValidationAt: timestamp('last_validation_at'),
  validationError: text('validation_error'),
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
}));

// ============================================================================
// CONFIGURATION BOT
// ============================================================================

export const botConfigs = mysqlTable('bot_configs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  apiKeyId: varchar('api_key_id', { length: 36 }),
  
  // Configuration générale
  totalCapital: decimal('total_capital', { precision: 10, scale: 2 }).default('0'),
  paperTrading: boolean('paper_trading').default(true),
  autoTrade: boolean('auto_trade').default(false),
  
  // Limites
  maxDailyTrades: int('max_daily_trades').default(10),
  maxOpenPositions: int('max_open_positions').default(3),
  riskPerTrade: decimal('risk_per_trade', { precision: 5, scale: 2 }).default('2'), // %
  
  // Stratégies (JSON)
  strategies: text('strategies').notNull(), // JSON string
  
  // État
  isRunning: boolean('is_running').default(false),
  startedAt: timestamp('started_at'),
  stoppedAt: timestamp('stopped_at'),
  
  // Métadonnées
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('bot_configs_user_id_idx').on(table.userId),
}));

// ============================================================================
// POSITIONS
// ============================================================================

export const positions = mysqlTable('positions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  botConfigId: varchar('bot_config_id', { length: 36 }),
  
  // Trade
  symbol: varchar('symbol', { length: 20 }).notNull(),
  side: varchar('side', { length: 10 }).notNull(), // 'buy', 'sell'
  strategy: varchar('strategy', { length: 50 }).notNull(),
  
  // Prix
  entryPrice: decimal('entry_price', { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal('current_price', { precision: 20, scale: 8 }).notNull(),
  exitPrice: decimal('exit_price', { precision: 20, scale: 8 }),
  
  // Quantité
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  investedAmount: decimal('invested_amount', { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }).notNull(),
  
  // P&L
  profitLoss: decimal('profit_loss', { precision: 10, scale: 2 }).default('0'),
  profitLossPercent: decimal('profit_loss_percent', { precision: 10, scale: 2 }).default('0'),
  
  // Gestion du risque
  stopLoss: decimal('stop_loss', { precision: 20, scale: 8 }),
  takeProfit: decimal('take_profit', { precision: 20, scale: 8 }),
  
  // Dates
  openTime: timestamp('open_time').notNull().defaultNow(),
  closeTime: timestamp('close_time'),
  
  // Statut
  status: varchar('status', { length: 20 }).default('open'), // 'open', 'closed'
  closeReason: varchar('close_reason', { length: 50 }), // 'manual', 'stop-loss', 'take-profit', 'signal'
  
  // Ordre Coinbase
  coinbaseOrderId: varchar('coinbase_order_id', { length: 255 }),
}, (table) => ({
  userIdIdx: index('positions_user_id_idx').on(table.userId),
  statusIdx: index('positions_status_idx').on(table.status),
  symbolIdx: index('positions_symbol_idx').on(table.symbol),
}));

// ============================================================================
// ABONNEMENTS
// ============================================================================

export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  
  // Stripe
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
  
  // Plan
  plan: varchar('plan', { length: 50 }).notNull(), // 'starter', 'pro', 'enterprise'
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'canceled', etc.
  
  // Dates
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  
  // Facturation
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('eur'),
  interval: varchar('interval', { length: 20 }).default('month'), // 'month', 'year'
  
  // Métadonnées
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
  stripeSubIdx: index('subscriptions_stripe_sub_idx').on(table.stripeSubscriptionId),
}));

// ============================================================================
// HISTORIQUE DES PAIEMENTS
// ============================================================================

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  subscriptionId: varchar('subscription_id', { length: 36 }),
  
  // Stripe
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
  stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
  
  // Montant
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('eur'),
  
  // Statut
  status: varchar('status', { length: 50 }).notNull(), // 'succeeded', 'pending', 'failed'
  failureReason: text('failure_reason'),
  
  // Dates
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('payments_user_id_idx').on(table.userId),
  statusIdx: index('payments_status_idx').on(table.status),
}));

// ============================================================================
// ALERTES
// ============================================================================

export const alerts = mysqlTable('alerts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }), // null = alerte globale
  
  symbol: varchar('symbol', { length: 20 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  confidence: int('confidence'),
  
  // Indicateurs
  rsi: decimal('rsi', { precision: 5, scale: 2 }),
  macd: decimal('macd', { precision: 10, scale: 4 }),
  volume: decimal('volume', { precision: 20, scale: 2 }),
  price: decimal('price', { precision: 20, scale: 8 }),
  
  // Métadonnées
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  isRead: boolean('is_read').default(false),
}, (table) => ({
  userIdIdx: index('alerts_user_id_idx').on(table.userId),
  symbolIdx: index('alerts_symbol_idx').on(table.symbol),
  createdAtIdx: index('alerts_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// LOGS D'ACTIVITÉ
// ============================================================================

export const activityLogs = mysqlTable('activity_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  
  // Action
  action: varchar('action', { length: 100 }).notNull(), // 'login', 'trade', 'config_update', etc.
  entity: varchar('entity', { length: 100 }), // 'position', 'bot_config', etc.
  entityId: varchar('entity_id', { length: 36 }),
  
  // Détails
  details: text('details'), // JSON
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Métadonnées
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('activity_logs_user_id_idx').on(table.userId),
  actionIdx: index('activity_logs_action_idx').on(table.action),
  createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(coinbaseApiKeys),
  botConfigs: many(botConfigs),
  positions: many(positions),
  subscriptions: many(subscriptions),
  payments: many(payments),
  alerts: many(alerts),
  activityLogs: many(activityLogs),
}));

export const coinbaseApiKeysRelations = relations(coinbaseApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [coinbaseApiKeys.userId],
    references: [users.id],
  }),
}));

export const botConfigsRelations = relations(botConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [botConfigs.userId],
    references: [users.id],
  }),
  apiKey: one(coinbaseApiKeys, {
    fields: [botConfigs.apiKeyId],
    references: [coinbaseApiKeys.id],
  }),
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  user: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
  botConfig: one(botConfigs, {
    fields: [positions.botConfigId],
    references: [botConfigs.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// LEADS MARKETING
// ============================================================================

export const leads = mysqlTable('leads', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  source: varchar('source', { length: 50 }).default('landing_page'), // 'landing_page', 'blog', 'twitter'
  status: varchar('status', { length: 50 }).default('subscribed'), // 'subscribed', 'unsubscribed'
  
  // Lead Magnet
  leadMagnetDownloaded: boolean('lead_magnet_downloaded').default(false),
  
  // Métadonnées
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
}, (table) => ({
  emailIdx: index('leads_email_idx').on(table.email),
}));
