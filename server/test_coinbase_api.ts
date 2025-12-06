/**
 * Script de test pour valider l'intégration de l'API Coinbase Advanced Trade
 * 
 * Ce script teste :
 * 1. La connexion à l'API
 * 2. La récupération des soldes de compte
 * 3. La récupération des prix en temps réel
 */

import { createCoinbaseAdvancedTradeClient } from './coinbaseAdvancedTradeClient';

async function testCoinbaseAPI() {
  console.log('\n🧪 Test de l\'API Coinbase Advanced Trade\n');
  console.log('='.repeat(60));

  try {
    // Créer le client
    console.log('\n1️⃣  Initialisation du client...');
    const client = createCoinbaseAdvancedTradeClient();
    console.log('✅ Client initialisé avec succès\n');

    // Test 1: Récupérer les comptes
    console.log('2️⃣  Récupération des comptes et soldes...');
    const accounts = await client.getAccounts();
    console.log(`✅ ${accounts.length} comptes trouvés:\n`);
    
    for (const account of accounts.slice(0, 10)) { // Afficher les 10 premiers comptes
      const balance = parseFloat(account.available_balance.value);
      if (balance > 0) {
        console.log(`   💰 ${account.currency}: ${balance} (disponible)`);
      }
    }

    // Test 2: Récupérer les prix
    console.log('\n3️⃣  Récupération des prix en temps réel...');
    const symbols = ['BTC-USD', 'ETH-USD', 'USDC-USD'];
    
    for (const symbol of symbols) {
      try {
        const product = await client.getProduct(symbol);
        console.log(`   📈 ${symbol}: $${parseFloat(product.price).toFixed(2)}`);
        console.log(`      Variation 24h: ${parseFloat(product.price_percentage_change_24h).toFixed(2)}%`);
      } catch (error) {
        console.log(`   ⚠️  ${symbol}: Non disponible`);
      }
    }

    // Test 3: Vérifier les soldes spécifiques
    console.log('\n4️⃣  Vérification des soldes pour le trading...');
    const eurBalance = await client.getBalance('EUR');
    const usdBalance = await client.getBalance('USD');
    const usdcBalance = await client.getBalance('USDC');
    
    console.log(`   💶 EUR: ${eurBalance.toFixed(2)}`);
    console.log(`   💵 USD: ${usdBalance.toFixed(2)}`);
    console.log(`   💵 USDC: ${usdcBalance.toFixed(2)}`);

    const totalFiat = eurBalance + usdBalance + usdcBalance;
    console.log(`   💰 Total fiat disponible: ${totalFiat.toFixed(2)}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tous les tests ont réussi !');
    console.log('='.repeat(60) + '\n');

    return true;
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
      }
    }
    console.log('\n' + '='.repeat(60) + '\n');
    return false;
  }
}

// Exécuter les tests
testCoinbaseAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
