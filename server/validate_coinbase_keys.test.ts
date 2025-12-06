import { describe, it, expect } from 'vitest';
import { Coinbase } from 'coinbase-advanced-node';

describe('Coinbase API Keys Validation', () => {
  it('should authenticate successfully with Coinbase API', async () => {
    const apiKey = process.env.COINBASE_API_KEY_ID;
    const apiSecret = process.env.COINBASE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('API keys are missing');
    }

    const client = new Coinbase({
      cloudApiKeyName: apiKey,
      cloudApiSecret: apiSecret
    });

    try {
      const accounts = await client.rest.account.listAccounts();
      expect(accounts).toBeDefined();
      expect(accounts.data).toBeDefined();
      console.log(`✅ Authentification réussie ! ${accounts.data.length} comptes trouvés.`);
    } catch (error: any) {
      console.error('❌ Erreur d\'authentification:', error.message);
      throw error;
    }
  });
});
