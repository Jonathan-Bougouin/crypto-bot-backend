import { Coinbase } from 'coinbase-advanced-node';

const apiKey = process.env.COINBASE_API_KEY_ID || '';
const apiSecret = process.env.COINBASE_API_SECRET || '';

console.log('🔑 Test de connexion Coinbase...');
console.log(`   API Key ID: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NON DÉFINIE'}`);
console.log(`   API Secret: ${apiSecret ? 'DÉFINI (Longueur: ' + apiSecret.length + ')' : 'NON DÉFINI'}`);

const client = new Coinbase({
  cloudApiKeyName: apiKey,
  cloudApiSecret: apiSecret
});

async function test() {
  try {
    console.log('📡 Envoi de la requête...');
    const accounts = await client.rest.account.listAccounts();
    console.log('✅ Connexion réussie !');
    console.log('   Comptes trouvés:', accounts.data.length);
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message || error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

test();
