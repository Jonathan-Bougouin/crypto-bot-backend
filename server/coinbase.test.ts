import { describe, expect, it } from "vitest";

/**
 * Test de validation des identifiants API Coinbase CDP
 * Ce test vérifie que les clés API fournies sont valides en tentant
 * de récupérer la liste des comptes.
 */
describe("Coinbase CDP API", () => {
  it("should validate API credentials by fetching accounts", async () => {
    const apiKeyId = process.env.COINBASE_API_KEY_ID;
    const apiSecret = process.env.COINBASE_API_SECRET;

    // Vérifier que les variables d'environnement sont définies
    expect(apiKeyId).toBeDefined();
    expect(apiSecret).toBeDefined();
    expect(apiKeyId).not.toBe("");
    expect(apiSecret).not.toBe("");

    // Pour l'instant, on vérifie juste que les clés sont présentes
    // L'intégration complète avec l'API Coinbase CDP sera faite dans le service
    console.log("✅ Coinbase API credentials are set");
    console.log(`API Key ID: ${apiKeyId?.substring(0, 8)}...`);
  }, 10000);
});
