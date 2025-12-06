import { describe, it, expect } from 'vitest';
import { Coinbase } from 'coinbase-advanced-node';

describe('Coinbase API Keys Validation V2', () => {
  it('should authenticate successfully with Coinbase API', async () => {
    const apiKey = process.env.COINBASE_API_KEY_ID;
    let apiSecret = process.env.COINBASE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('API keys are missing');
    }

    // Tentative de correction du format de la clé si nécessaire
    // Remplacer les \n littéraux par de vrais sauts de ligne
    apiSecret = apiSecret.replace(/\\n/g, '\n');

    // Corriger les espaces manquants dans les en-têtes si nécessaire
    if (apiSecret.includes('BEGINECPRIVATEKEY')) {
        apiSecret = apiSecret.replace('-----BEGINECPRIVATEKEY-----', '-----BEGIN EC PRIVATE KEY-----');
    }
    if (apiSecret.includes('ENDECPRIVATEKEY')) {
        apiSecret = apiSecret.replace('-----ENDECPRIVATEKEY-----', '-----END EC PRIVATE KEY-----');
    }

    // S'assurer qu'il y a des sauts de ligne après le header et avant le footer
    if (!apiSecret.includes('KEY-----\n')) {
        apiSecret = apiSecret.replace('KEY-----', 'KEY-----\n');
    }
    if (!apiSecret.includes('\n-----END')) {
        apiSecret = apiSecret.replace('-----END', '\n-----END');
    }

    console.log('Testing with API Key:', apiKey);
    console.log('Secret length:', apiSecret.length);
    console.log('Secret starts with:', apiSecret.substring(0, 30));

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
      if (error.response) {
          console.error('Response data:', error.response.data);
      }
      throw error;
    }
  });
});
