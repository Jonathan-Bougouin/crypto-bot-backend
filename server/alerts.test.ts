import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("alerts router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list alerts", async () => {
    const result = await caller.alerts.list();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Vérifier la structure des alertes si elles existent
    if (result.length > 0) {
      const alert = result[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('asset');
      expect(alert).toHaveProperty('price');
      expect(alert).toHaveProperty('signalType');
      expect(alert).toHaveProperty('confidence');
      expect(alert).toHaveProperty('recommendation');
      expect(alert).toHaveProperty('indicatorsTriggered');
      expect(Array.isArray(alert.indicatorsTriggered)).toBe(true);
    }
  });

  it("should filter alerts by asset", async () => {
    const asset = "BTC-USD";
    const result = await caller.alerts.byAsset({ asset });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Vérifier que toutes les alertes retournées correspondent à l'actif demandé
    result.forEach(alert => {
      expect(alert.asset).toBe(asset);
    });
  });

  it("should generate new alerts", async () => {
    const result = await caller.alerts.generate();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
  });
});
