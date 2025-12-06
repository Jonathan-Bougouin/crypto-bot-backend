/**
 * Coinbase Advanced Trade API Client
 * 
 * Client HTTP pour interagir avec l'API Advanced Trade de Coinbase.
 * Gère l'authentification JWT et les requêtes vers les endpoints de trading.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const COINBASE_API_HOST = 'api.coinbase.com';
const COINBASE_API_BASE_URL = `https://${COINBASE_API_HOST}`;

interface JWTOptions {
  apiKey: string;
  apiSecret: string;
  requestMethod: string;
  requestPath: string;
}

interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  ready: boolean;
  hold: {
    value: string;
    currency: string;
  };
}

interface CoinbaseProduct {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  volume_percentage_change_24h: string;
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  base_name: string;
  quote_name: string;
  watched: boolean;
  is_disabled: boolean;
  new: boolean;
  status: string;
  cancel_only: boolean;
  limit_only: boolean;
  post_only: boolean;
  trading_disabled: boolean;
  auction_mode: boolean;
  product_type: string;
  quote_currency_id: string;
  base_currency_id: string;
}

interface OrderConfiguration {
  market_market_ioc?: {
    quote_size?: string;
    base_size?: string;
  };
  limit_limit_gtc?: {
    base_size: string;
    limit_price: string;
    post_only?: boolean;
  };
}

interface PlaceOrderParams {
  client_order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  order_configuration: OrderConfiguration;
}

interface CoinbaseOrder {
  success: boolean;
  failure_reason?: string;
  order_id?: string;
  success_response?: {
    order_id: string;
    product_id: string;
    side: string;
    client_order_id: string;
  };
  error_response?: {
    error: string;
    message: string;
    error_details: string;
  };
}

/**
 * Convertit une clé brute (base64) en format PEM
 */
function convertToPEM(rawKey: string): string {
  // Si la clé est déjà au format PEM, la retourner telle quelle
  if (rawKey.includes('BEGIN EC PRIVATE KEY') || rawKey.includes('BEGIN PRIVATE KEY')) {
    return rawKey;
  }
  
  // Sinon, convertir la clé base64 en format PEM
  const pemHeader = '-----BEGIN EC PRIVATE KEY-----';
  const pemFooter = '-----END EC PRIVATE KEY-----';
  
  // Diviser la clé en lignes de 64 caractères
  const keyLines = rawKey.match(/.{1,64}/g) || [];
  
  return `${pemHeader}\n${keyLines.join('\n')}\n${pemFooter}`;
}

/**
 * Génère un JWT pour authentifier une requête API Coinbase
 */
function generateJWT(options: JWTOptions): string {
  const { apiKey, apiSecret, requestMethod, requestPath } = options;
  
  // Create JWT URI
  const uri = `${requestMethod} ${COINBASE_API_HOST}${requestPath}`;
  
  // JWT payload
  const payload = {
    iss: 'coinbase-cloud',
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
    sub: apiKey,
    uri: uri
  };
  
  // Convertir la clé au format PEM si nécessaire
  const pemKey = convertToPEM(apiSecret);
  
  // Sign JWT with ES256 algorithm
  const token = jwt.sign(payload, pemKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: apiKey,
      typ: 'JWT'
    }
  });
  
  return token;
}

/**
 * Client pour l'API Advanced Trade de Coinbase
 */
export class CoinbaseAdvancedTradeClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Effectue une requête authentifiée vers l'API Coinbase
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    // Générer le JWT pour cette requête
    const token = generateJWT({
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      requestMethod: method,
      requestPath: path
    });

    // Préparer les options de la requête
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Ajouter le body si nécessaire
    if (body) {
      options.body = JSON.stringify(body);
    }

    // Effectuer la requête
    const response = await fetch(`${COINBASE_API_BASE_URL}${path}`, options);

    // Vérifier le statut de la réponse
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coinbase API error (${response.status}): ${errorText}`);
    }

    // Parser et retourner la réponse
    const data = await response.json();
    return data as T;
  }

  /**
   * Récupère tous les comptes et leurs soldes
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const response = await this.request<{ accounts: CoinbaseAccount[] }>(
      'GET',
      '/api/v3/brokerage/accounts'
    );
    return response.accounts;
  }

  /**
   * Récupère les informations d'un produit (paire de trading)
   */
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    const response = await this.request<CoinbaseProduct>(
      'GET',
      `/api/v3/brokerage/products/${productId}`
    );
    return response;
  }

  /**
   * Place un ordre sur Coinbase
   */
  async placeOrder(params: PlaceOrderParams): Promise<CoinbaseOrder> {
    const response = await this.request<CoinbaseOrder>(
      'POST',
      '/api/v3/brokerage/orders',
      params
    );
    return response;
  }

  /**
   * Récupère le solde d'une devise spécifique
   */
  async getBalance(currency: string): Promise<number> {
    const accounts = await this.getAccounts();
    const account = accounts.find(acc => acc.currency === currency);
    
    if (!account) {
      return 0;
    }

    return parseFloat(account.available_balance.value);
  }

  /**
   * Récupère le prix actuel d'un produit
   */
  async getPrice(productId: string): Promise<number> {
    const product = await this.getProduct(productId);
    return parseFloat(product.price);
  }

  /**
   * Place un ordre au marché (achat)
   */
  async placeBuyMarketOrder(
    productId: string,
    quoteSize: string
  ): Promise<CoinbaseOrder> {
    const clientOrderId = `buy-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    return this.placeOrder({
      client_order_id: clientOrderId,
      product_id: productId,
      side: 'BUY',
      order_configuration: {
        market_market_ioc: {
          quote_size: quoteSize
        }
      }
    });
  }

  /**
   * Place un ordre au marché (vente)
   */
  async placeSellMarketOrder(
    productId: string,
    baseSize: string
  ): Promise<CoinbaseOrder> {
    const clientOrderId = `sell-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    return this.placeOrder({
      client_order_id: clientOrderId,
      product_id: productId,
      side: 'SELL',
      order_configuration: {
        market_market_ioc: {
          base_size: baseSize
        }
      }
    });
  }

  /**
   * Place un ordre limite (achat)
   */
  async placeBuyLimitOrder(
    productId: string,
    baseSize: string,
    limitPrice: string
  ): Promise<CoinbaseOrder> {
    const clientOrderId = `buy-limit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    return this.placeOrder({
      client_order_id: clientOrderId,
      product_id: productId,
      side: 'BUY',
      order_configuration: {
        limit_limit_gtc: {
          base_size: baseSize,
          limit_price: limitPrice,
          post_only: false
        }
      }
    });
  }

  /**
   * Place un ordre limite (vente)
   */
  async placeSellLimitOrder(
    productId: string,
    baseSize: string,
    limitPrice: string
  ): Promise<CoinbaseOrder> {
    const clientOrderId = `sell-limit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    return this.placeOrder({
      client_order_id: clientOrderId,
      product_id: productId,
      side: 'SELL',
      order_configuration: {
        limit_limit_gtc: {
          base_size: baseSize,
          limit_price: limitPrice,
          post_only: false
        }
      }
    });
  }
}

/**
 * Crée une instance du client Coinbase Advanced Trade
 */
export function createCoinbaseAdvancedTradeClient(): CoinbaseAdvancedTradeClient {
  const apiKey = process.env.COINBASE_API_KEY_ID;
  const apiSecret = process.env.COINBASE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('COINBASE_API_KEY_ID and COINBASE_API_SECRET must be set in environment variables');
  }

  return new CoinbaseAdvancedTradeClient(apiKey, apiSecret);
}
