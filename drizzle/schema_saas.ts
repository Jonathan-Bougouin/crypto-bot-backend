/**
 * Schéma de base de données pour la plateforme SaaS multi-tenant
 */

import { pgTable, text, integer, timestamp, boolean, decimal, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// UTILISATEURS
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  
  // Profil
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
  
  // Abonnement
  subscriptionStatus: text('subscription_status').$type<'active' | 'canceled' | 'past_due' | 'trialing' | 'none'>().default('none'),
  subscriptionPlan: text('subscription_plan').$type<'starter' | 'pro' | 'enterprise'>(),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  trialEndsAt: timestamp('trial_ends_at'),
  
  // Facturation Stripe
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  billingEmail: text('billing_email'),
  
  // Statut
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  role: text('role').$type<'user' | 'admin'>().default('user'),
  
  // Réinitialisation de mot de passe
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  stripeCustomerIdx: index('stripe_customer_idx').on(table.stripeCustomerId),
}));

// ============================================================================
// CLÉS API COINBASE
// ============================================================================

export const coinbaseApiKeys = pgTable('coinbase_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Clés chiffrées (AES-256-GCM)
  apiKeyId: text('api_key_id').notNull(), // Chiffré
  apiSecret: text('api_secret').notNull(), // Chiffré
  
  // Métadonnées
  nickname: text('nickname'),
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

export const botConfigs = pgTable('bot_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyId: uuid('api_key_id').references(() => coinbaseApiKeys.id, { onDelete: 'set null' }),
  
  // Configuration générale
  totalCapital: decimal('total_capital', { precision: 10, scale: 2 }).default('0'),
  paperTrading: boolean('paper_trading').default(true),
  autoTrade: boolean('auto_trade').default(false),
  
  // Limites
  maxDailyTrades: integer('max_daily_trades').default(10),
  maxOpenPositions: integer('max_open_positions').default(3),
  riskPerTrade: decimal('risk_per_trade', { precision: 5, scale: 2 }).default('2'), // %
  
  // Stratégies (JSON)
  strategies: text('strategies').notNull().default('{}'),
  
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

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  botConfigId: uuid('bot_config_id').references(() => botConfigs.id, { onDelete: 'set null' }),
  
  // Trade
  symbol: text('symbol').notNull(),
  side: text('side').$type<'buy' | 'sell'>().notNull(),
  strategy: text('strategy').notNull(),
  
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
  status: text('status').$type<'open' | 'closed'>().default('open'),
  closeReason: text('close_reason').$type<'manual' | 'stop-loss' | 'take-profit' | 'signal'>(),
  
  // Ordre Coinbase
  coinbaseOrderId: text('coinbase_order_id'),
}, (table) => ({
  userIdIdx: index('positions_user_id_idx').on(table.userId),
  statusIdx: index('positions_status_idx').on(table.status),
  symbolIdx: index('positions_symbol_idx').on(table.symbol),
}));

// ============================================================================
// ABONNEMENTS
// ============================================================================

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Stripe
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  
  // Plan
  plan: text('plan').$type<'starter' | 'pro' | 'enterprise'>().notNull(),
  status: text('status').$type<'active' | 'canceled' | 'past_due' | 'trialing'>().notNull(),
  
  // Dates
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  
  // Facturation
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('eur'),
  interval: text('interval').$type<'month' | 'year'>().default('month'),
  
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

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  
  // Stripe
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeInvoiceId: text('stripe_invoice_id'),
  
  // Montant
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('eur'),
  
  // Statut
  status: text('status').$type<'succeeded' | 'pending' | 'failed'>().notNull(),
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

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = alerte globale
  
  symbol: text('symbol').notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  confidence: integer('confidence'),
  
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

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Action
  action: text('action').notNull(), // 'login', 'trade', 'config_update', etc.
  entity: text('entity'), // 'position', 'bot_config', etc.
  entityId: uuid('entity_id'),
  
  // Détails
  details: text('details'), // JSON
  ipAddress: text('ip_address'),
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

export const usersRelations = relations(users, ({ many, one }) => ({
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
