import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { alerts, InsertAlert, InsertTrade, InsertUser, trades, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Alert-related queries
 */

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create alert: database not available");
    return null;
  }

  try {
    const result = await db.insert(alerts).values(alert);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create alert:", error);
    throw error;
  }
}

export async function getRecentAlerts(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get alerts: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.timestamp))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get alerts:", error);
    return [];
  }
}

export async function getAlertsByAsset(asset: string, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get alerts: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(alerts)
      .where(eq(alerts.asset, asset))
      .orderBy(desc(alerts.timestamp))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get alerts:", error);
    return [];
  }
}

/**
 * Trade-related queries
 */

export async function createTrade(trade: InsertTrade) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create trade: database not available");
    return null;
  }

  try {
    const result = await db.insert(trades).values(trade);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create trade:", error);
    throw error;
  }
}

export async function getAllTrades(limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trades: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(trades)
      .orderBy(desc(trades.entryTime))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get trades:", error);
    return [];
  }
}

export async function getTradesByAsset(asset: string, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trades: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(trades)
      .where(eq(trades.asset, asset))
      .orderBy(desc(trades.entryTime))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get trades:", error);
    return [];
  }
}

export async function getClosedTrades(limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get closed trades: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(trades)
      .where(eq(trades.status, "closed"))
      .orderBy(desc(trades.exitTime))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get closed trades:", error);
    return [];
  }
}
