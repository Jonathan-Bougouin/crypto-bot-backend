/**
 * Client Coinbase utilisant le package coinbase-advanced-node
 * 
 * Ce client utilise le package officiel qui gère correctement
 * l'authentification JWT avec les clés CDP de Coinbase.
 */

import { Coinbase, OrderSide } from 'coinbase-advanced-node';

const apiKey = process.env.COINBASE_API_KEY_ID || '';
let apiSecret = process.env.COINBASE_API_SECRET || '';

if (!apiKey || !apiSecret) {
  console.error('❌ Les identifiants API Coinbase ne sont pas configurés');
}

// Correction automatique du format de la clé privée
if (apiSecret) {
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
}

/**
 * Créer une instance du client Coinbase
 */
export function createCoinbaseRealClient(): Coinbase {
  console.log('✅ Client Coinbase initialisé avec succès');
  return new Coinbase({
    cloudApiKeyName: apiKey,
    cloudApiSecret: apiSecret
  });
}

/**
 * Récupérer tous les comptes
 */
export async function getRealAccounts() {
  const client = createCoinbaseRealClient();
  
  try {
    const response = await client.rest.account.listAccounts();
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts from Coinbase:', error);
    throw error;
  }
}

/**
 * Récupérer le solde d'une devise spécifique
 */
export async function getRealBalance(currency: string): Promise<number> {
  const accounts = await getRealAccounts();
  const account = accounts.find((acc: any) => acc.currency === currency);
  
  if (!account) {
    return 0;
  }
  
  return parseFloat(account.available_balance?.value || '0');
}

/**
 * Récupérer les informations d'un produit
 */
export async function getRealProduct(productId: string) {
  const client = createCoinbaseRealClient();
  
  try {
    const response = await client.rest.product.getProduct(productId);
    return response;
  } catch (error) {
    console.error(`Error fetching product ${productId} from Coinbase:`, error);
    throw error;
  }
}

/**
 * Récupérer le prix actuel d'un produit
 */
export async function getRealPrice(productId: string): Promise<number> {
  const product = await getRealProduct(productId);
  if (!product || !product.price) {
    throw new Error(`Unable to get price for ${productId}`);
  }
  return parseFloat(product.price);
}

/**
 * Placer un ordre au marché (achat)
 */
export async function placeRealBuyOrder(
  productId: string,
  quoteSize: string
): Promise<any> {
  const client = createCoinbaseRealClient();
  
  try {
    const response = await client.rest.order.placeOrder({
      client_order_id: `buy-${Date.now()}`,
      product_id: productId,
      side: OrderSide.BUY,
      order_configuration: {
        market_market_ioc: {
          quote_size: quoteSize
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error placing buy order:', error);
    throw error;
  }
}

/**
 * Placer un ordre au marché (vente)
 */
export async function placeRealSellOrder(
  productId: string,
  baseSize: string
): Promise<any> {
  const client = createCoinbaseRealClient();
  
  try {
    const response = await client.rest.order.placeOrder({
      client_order_id: `sell-${Date.now()}`,
      product_id: productId,
      side: OrderSide.SELL,
      order_configuration: {
        market_market_ioc: {
          base_size: baseSize
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error placing sell order:', error);
    throw error;
  }
}

export default {
  createCoinbaseRealClient,
  getRealAccounts,
  getRealBalance,
  getRealProduct,
  getRealPrice,
  placeRealBuyOrder,
  placeRealSellOrder
};
