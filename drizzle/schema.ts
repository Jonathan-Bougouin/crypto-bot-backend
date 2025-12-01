import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Alerts table for storing crypto trading alerts
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  price: varchar("price", { length: 50 }).notNull(), // Store as string to preserve precision
  signalType: varchar("signalType", { length: 50 }).notNull(),
  confidence: varchar("confidence", { length: 20 }).notNull(),
  recommendation: text("recommendation").notNull(),
  indicatorsTriggered: text("indicatorsTriggered").notNull(), // JSON array stored as text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Trades table for storing trading history and performance tracking
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId"), // Reference to the alert that triggered this trade (optional)
  asset: varchar("asset", { length: 20 }).notNull(),
  entryPrice: varchar("entryPrice", { length: 50 }).notNull(), // Store as string to preserve precision
  exitPrice: varchar("exitPrice", { length: 50 }), // Null if trade is still open
  quantity: varchar("quantity", { length: 50 }).notNull(), // Amount traded
  profit: varchar("profit", { length: 50 }), // Profit/loss in USD (null if trade is still open)
  profitPercent: varchar("profitPercent", { length: 20 }), // Profit/loss percentage
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).default("open").notNull(),
  entryTime: timestamp("entryTime").notNull(),
  exitTime: timestamp("exitTime"), // Null if trade is still open
  notes: text("notes"), // Optional notes about the trade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;