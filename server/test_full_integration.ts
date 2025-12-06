/**
 * Script de test complet pour valider l'intégration Coinbase
 * 
 * Ce script teste :
 * 1. La récupération des soldes
 * 2. La récupération des prix
 * 3. Le placement d'ordres (en mode Paper Trading par défaut)
 */

import { getAccountBalances, getCurrentPrice, placeOrder, calculateMaxBuyAmount } from './coinbaseService';

async function testFullIntegration() {
  console.log('\n🧪 Test d\'intégration complète Coinbase\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Récupérer les soldes (mode Paper Trading)
    console.log('\n1️⃣  Test des soldes (Paper Trading)...');
    const paperBalances = await getAccountBalances(true);
    console.log('✅ Soldes Paper Trading:');
    for (const account of paperBalances) {
      console.log(`   ${account.currency}: ${account.available}`);
    }

    // Test 2: Récupérer les soldes (mode Réel)
    console.log('\n2️⃣  Test des soldes (Réel)...');
    const realBalances = await getAccountBalances(false);
    console.log('✅ Soldes réels:');
    for (const account of realBalances.slice(0, 5)) {
      const balance = parseFloat(account.available);
      if (balance > 0) {
        console.log(`   ${account.currency}: ${account.available}`);
      }
    }

    // Test 3: Récupérer les prix (mode Paper Trading)
    console.log('\n3️⃣  Test des prix (Paper Trading)...');
    const paperPrice = await getCurrentPrice('BTC-USD', true);
    console.log(`✅ Prix Paper Trading BTC-USD: $${paperPrice.price.toFixed(2)}`);

    // Test 4: Récupérer les prix (mode Réel)
    console.log('\n4️⃣  Test des prix (Réel)...');
    const realPrice = await getCurrentPrice('BTC-USD', false);
    console.log(`✅ Prix réel BTC-USD: $${realPrice.price.toFixed(2)}`);

    // Test 5: Calculer le montant maximum d'achat
    console.log('\n5️⃣  Test du calcul du montant maximum...');
    const maxBuyAmount = await calculateMaxBuyAmount('BTC-USD', 50);
    console.log(`✅ Montant maximum de BTC achetable avec 50€: ${maxBuyAmount.toFixed(8)} BTC`);

    // Test 6: Placer un ordre Paper Trading
    console.log('\n6️⃣  Test de placement d\'ordre (Paper Trading)...');
    const paperOrder = await placeOrder({
      symbol: 'BTC-USD',
      side: 'buy',
      amount: 0.0001,
      type: 'market'
    }, true);
    console.log(`✅ Ordre Paper Trading: ${paperOrder.status}`);
    console.log(`   ID: ${paperOrder.orderId}`);
    console.log(`   Message: ${paperOrder.message}`);

    // Test 7: Vérifier que le mode réel est disponible (sans exécuter)
    console.log('\n7️⃣  Vérification du mode Trading Réel...');
    console.log('⚠️  Mode Trading Réel disponible mais non testé (pour éviter les transactions accidentelles)');
    console.log('   Pour activer le trading réel, utilisez paperTrading: false');

    console.log('\n' + '='.repeat(70));
    console.log('✅ Tous les tests ont réussi !');
    console.log('='.repeat(70) + '\n');

    console.log('📋 Résumé:');
    console.log('   - Soldes Paper Trading: ✅');
    console.log('   - Soldes réels: ✅');
    console.log('   - Prix Paper Trading: ✅');
    console.log('   - Prix réels: ✅');
    console.log('   - Calcul montant max: ✅');
    console.log('   - Ordre Paper Trading: ✅');
    console.log('   - Mode Trading Réel: ✅ (disponible)\n');

    return true;
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
      }
    }
    console.log('\n' + '='.repeat(70) + '\n');
    return false;
  }
}

// Exécuter les tests
testFullIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
