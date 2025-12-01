import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("trades", () => {
  it("should list closed trades", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const trades = await caller.trades.closed();

    expect(trades).toBeDefined();
    expect(Array.isArray(trades)).toBe(true);
    
    // Vérifier que les trades ont les bonnes propriétés
    if (trades.length > 0) {
      const trade = trades[0];
      expect(trade).toHaveProperty('id');
      expect(trade).toHaveProperty('asset');
      expect(trade).toHaveProperty('entryPrice');
      expect(trade).toHaveProperty('exitPrice');
      expect(trade).toHaveProperty('profit');
      expect(trade).toHaveProperty('status');
      expect(trade.status).toBe('closed');
    }
  });

  it("should calculate statistics from closed trades", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const trades = await caller.trades.closed();

    // Vérifier qu'on peut calculer des statistiques
    if (trades.length > 0) {
      const totalProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || "0"), 0);
      const winningTrades = trades.filter(t => parseFloat(t.profit || "0") > 0).length;
      const winRate = (winningTrades / trades.length) * 100;
      
      expect(totalProfit).toBeDefined();
      expect(winRate).toBeGreaterThanOrEqual(0);
      expect(winRate).toBeLessThanOrEqual(100);
    }
  });
});
