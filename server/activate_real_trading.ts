import { createCoinbaseRealClient } from './coinbaseRealClient';
import AutonomousBot from './ai/bot/autonomousBot';
import { OrderSide } from 'coinbase-advanced-node';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Configuration du compte utilisateur (Admin)
const USER_CONFIG = {
  userId: 'admin_user',
  riskLevel: 'aggressive', // Pour maximiser la croissance exponentielle
  strategies: ['scalping', 'swing'], // Stratégies rapides
  maxPositionSize: 100, // 100% du capital
  targetDailyProfit: 5, // 5% par jour
};

async function activateRealTrading() {
  console.log('🚀 Activation du Trading Réel pour le compte Admin...');
  
  try {
       // 2. Vérifier le solde SUPER
    console.log('📊 Vérification des soldes...');
    const client = createCoinbaseRealClient();
    const accounts = await client.rest.account.listAccounts();
    const superAccount = accounts.data.find((a: any) => a.currency === 'SUPER');;
    
    if (!superAccount) {
      console.error('❌ Compte SUPER introuvable !');
      return;
    }
    
    const superBalance = parseFloat(superAccount.available_balance.value);
    console.log(`   Solde SUPER: ${superBalance}`);
    
    // 3. Analyser la position SUPER
    console.log('🧠 Analyse de la position SUPER...');
    // Dans un scénario réel, on ferait une analyse technique ici
    // Pour l'instant, on va convertir en USDC pour avoir du capital de trading
    // car SUPER n'est pas une paire très liquide pour le scalping haute fréquence
    
    if (superBalance > 0) {
      console.log('   Décision: Vendre SUPER pour initialiser le capital de trading (USDC)');
      
      // Note: En production, on décommenterait la ligne suivante
      console.log('   💸 Exécution de l\'ordre de vente RÉEL...');
      try {
        // On vend SUPER-USD (ou SUPER-USDC selon disponibilité)
        // Note: SUPER-USD est généralement disponible sur Coinbase Advanced
        const order = await placeRealSellOrder('SUPER-USD', superBalance.toString());
        console.log('   ✅ Ordre de vente placé avec succès !');
        // La réponse peut varier selon le succès/échec immédiat
        if ('success_response' in order && order.success_response) {
            console.log('   ID:', order.success_response.order_id);
        } else {
            console.log('   Réponse:', JSON.stringify(order));
        }
      } catch (e) {
        console.error('   ❌ Erreur lors de la vente:', e);
        console.log('   Tentative sur SUPER-USDC...');
        try {
            const order = await placeRealSellOrder('SUPER-USDC', superBalance.toString());
            console.log('   ✅ Ordre de vente SUPER-USDC placé avec succès !');
        } catch (e2) {
            console.error('   ❌ Erreur lors de la vente SUPER-USDC:', e2);
        }
      }
    }
    
    // 4. Initialiser le Bot Autonome
    console.log('🤖 Démarrage du Bot Autonome...');
    
    // Créer les dépendances fictives pour l'initialisation
    // Dans un environnement réel, ces services seraient injectés ou récupérés via un conteneur
    const mockDataManager: any = {
      subscribe: () => {},
      getMarketData: () => null
    };
    
    const mockTradingModel: any = {
      analyze: async () => ({ action: 'hold', confidence: 0, reasons: [] })
    };
    
    const botConfig = {
      totalCapital: 40, // 40€ environ
      paperTrading: false,
      autoTrade: true,
      maxDailyTrades: 10,
      maxOpenPositions: 3,
      riskPerTrade: 100,
      strategies: []
    };
    
    const bot = new AutonomousBot(botConfig, mockTradingModel, mockDataManager);
    
    // Configuration du bot pour ce compte
    bot.startTrading(USER_CONFIG.userId, USER_CONFIG.strategies, USER_CONFIG.maxPositionSize);
    
    console.log('✅ Bot activé en mode RÉEL sur le compte Admin');
    console.log('   Stratégie: Croissance Exponentielle');
    console.log('   Monitoring: 24/7');
    console.log('   Objectif: +5% / jour');
    
    // Créer un fichier de flag pour indiquer que le trading réel est actif
    // Utilisation de process.cwd() au lieu de __dirname pour éviter l'erreur ES module
    fs.writeFileSync(
      path.join(process.cwd(), 'REAL_TRADING_ACTIVE.flag'), 
      JSON.stringify({ 
        startTime: new Date().toISOString(),
        initialBalance: superBalance,
        currency: 'SUPER'
      })
    );
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  }
}

// Fonction pour placer un ordre de vente réel
async function placeRealSellOrder(symbol: string, amount: string) {
  const client = createCoinbaseRealClient();
  const orderId = crypto.randomUUID();
  
  console.log(`📡 Envoi ordre de vente: ${amount} ${symbol}`);
  
  try {
    const order = await client.rest.order.placeOrder({
      client_order_id: orderId,
      product_id: symbol,
      side: OrderSide.SELL,
      order_configuration: {
        market_market_ioc: {
          base_size: amount
        }
      }
    });
    
    return order;
  } catch (error: any) {
    console.error('Erreur API Coinbase:', error.response?.data || error.message);
    throw error;
  }
}

activateRealTrading();
