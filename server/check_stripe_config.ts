import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.log('❌ STRIPE_SECRET_KEY manquante dans les variables d\'environnement');
  process.exit(1);
}

console.log('✅ STRIPE_SECRET_KEY détectée');
console.log(`   Préfixe: ${stripeKey.substring(0, 7)}...`);

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-01-27.acacia', // Utiliser une version récente ou 'latest'
} as any);

async function checkProducts() {
  try {
    console.log('📡 Récupération des produits Stripe...');
    const products = await stripe.products.list({ limit: 10, active: true });
    
    console.log(`✅ ${products.data.length} produits trouvés :`);
    products.data.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
    });

    if (products.data.length === 0) {
        console.log('⚠️ Aucun produit trouvé. Il faudra les créer.');
    }
  } catch (error: any) {
    console.error('❌ Erreur de connexion Stripe:', error.message);
  }
}

checkProducts();
