import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { getRealAccounts, getRealBalance, getRealPrice, placeRealBuyOrder, placeRealSellOrder } from './coinbaseRealClient';

/**
 * Service Coinbase pour gérer les comptes et les ordres de trading
 * Utilise l'API Coinbase CDP pour interagir avec les comptes de trading
 */

// Configuration de l'API Coinbase
const apiKeyId = process.env.COINBASE_API_KEY_ID;
const apiSecret = process.env.COINBASE_API_SECRET;

if (!apiKeyId || !apiSecret) {
  console.error("❌ Les identifiants API Coinbase ne sont pas configurés");
}

// Initialiser le client Coinbase
let coinbase: Coinbase | null = null;

try {
  coinbase = new Coinbase({
    apiKeyName: apiKeyId!,
    privateKey: apiSecret!,
  });
  console.log("✅ Client Coinbase initialisé avec succès");
} catch (error) {
  console.error("❌ Erreur lors de l'initialisation du client Coinbase:", error);
}

console.log("✅ Client Coinbase Advanced Trade prêt (utilise coinbase-advanced-node)");

/**
 * Interface pour les informations de compte
 */
export interface AccountInfo {
  currency: string;
  balance: string;
  available: string;
  hold: string;
}

/**
 * Interface pour les informations de prix
 */
export interface PriceInfo {
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Interface pour un ordre de trading
 */
export interface TradeOrder {
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  price?: number; // Prix limite (optionnel, sinon ordre au marché)
  type: "market" | "limit";
}

/**
 * Interface pour le résultat d'un ordre
 */
export interface OrderResult {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  status: "pending" | "completed" | "failed";
  timestamp: number;
  message?: string;
}

/**
 * Récupérer les informations du compte (soldes)
 */
export async function getAccountBalances(usePaperTrading: boolean = true): Promise<AccountInfo[]> {
  if (usePaperTrading) {
    // Mode Paper Trading : retourner des données simulées
    return [
      {
        currency: "EUR",
        balance: "50.00",
        available: "50.00",
        hold: "0.00",
      },
      {
        currency: "BTC",
        balance: "0.00000000",
        available: "0.00000000",
        hold: "0.00000000",
      },
      {
        currency: "ETH",
        balance: "0.00000000",
        available: "0.00000000",
        hold: "0.00000000",
      },
    ];
  }

  // Mode réel : récupérer les soldes depuis Coinbase
  try {
    const accounts = await getRealAccounts();
    return accounts.map((account: any) => ({
      currency: account.currency,
      balance: account.available_balance?.value || '0',
      available: account.available_balance?.value || '0',
      hold: account.hold?.value || '0',
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes:", error);
    throw error;
  }
}

/**
 * Récupérer le prix actuel d'une paire de trading
 */
export async function getCurrentPrice(symbol: string, usePaperTrading: boolean = true): Promise<PriceInfo> {
  if (usePaperTrading) {
    // Mode Paper Trading : utiliser des prix simulés
    const mockPrices: Record<string, number> = {
      "BTC-USD": 42500.0,
      "ETH-USD": 2250.0,
      "PEPE-USD": 0.000001234,
    };

    return {
      symbol,
      price: mockPrices[symbol] || 0,
      timestamp: Date.now(),
    };
  }

  // Mode réel : récupérer le prix depuis Coinbase
  try {
    const price = await getRealPrice(symbol);
    return {
      symbol,
      price,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du prix:", error);
    throw error;
  }
}

/**
 * Placer un ordre de trading (mode Paper Trading pour l'instant)
 */
export async function placeOrder(
  order: TradeOrder,
  paperTrading: boolean = true
): Promise<OrderResult> {
  if (!coinbase && !paperTrading) {
    throw new Error("Client Coinbase non initialisé");
  }

  try {
    if (paperTrading) {
      // Mode Paper Trading : utiliser le service de portefeuille virtuel
      console.log("📝 Mode Paper Trading - Ordre simulé:", order);

      const { executePaperTrade } = await import("./paperTradingService");
      const currentPrice = await getCurrentPrice(order.symbol);
      const executionPrice = order.type === "limit" && order.price ? order.price : currentPrice.price;

      // Exécuter le trade dans le portefeuille virtuel
      const result = executePaperTrade(
        order.symbol,
        order.side,
        order.amount,
        executionPrice
      );

      if (!result.success) {
        return {
          orderId: `paper-error-${Date.now()}`,
          symbol: order.symbol,
          side: order.side,
          amount: order.amount,
          price: executionPrice,
          status: "failed",
          timestamp: Date.now(),
          message: result.message || "Échec de l'ordre Paper Trading",
        };
      }

      return {
        orderId: result.trade!.id,
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        price: executionPrice,
        status: "completed",
        timestamp: Date.now(),
        message: result.message || "Ordre simulé en mode Paper Trading",
      };
    } else {
      // Mode Trading Réel : exécuter l'ordre via l'API Coinbase
      console.log("💰 Mode Trading Réel - Exécution de l'ordre:", order);

      try {
        const currentPrice = await getCurrentPrice(order.symbol, false);
        const executionPrice = order.type === "limit" && order.price ? order.price : currentPrice.price;

        let response;
        if (order.side === "buy") {
          // Calculer le montant en quote (EUR/USD) pour l'achat
          const quoteSize = (order.amount * executionPrice).toFixed(2);
          response = await placeRealBuyOrder(order.symbol, quoteSize);
        } else {
          // Pour la vente, utiliser le montant en base (crypto)
          const baseSize = order.amount.toString();
          response = await placeRealSellOrder(order.symbol, baseSize);
        }

        // Vérifier si l'ordre a réussi
        if (response.success) {
          return {
            orderId: response.success_response?.order_id || `real-${Date.now()}`,
            symbol: order.symbol,
            side: order.side,
            amount: order.amount,
            price: executionPrice,
            status: "completed",
            timestamp: Date.now(),
            message: "Ordre exécuté avec succès sur Coinbase",
          };
        } else {
          return {
            orderId: `real-error-${Date.now()}`,
            symbol: order.symbol,
            side: order.side,
            amount: order.amount,
            price: executionPrice,
            status: "failed",
            timestamp: Date.now(),
            message: response.error_response?.message || "Échec de l'ordre",
          };
        }
      } catch (error) {
        console.error("Erreur lors de l'exécution de l'ordre réel:", error);
        return {
          orderId: `real-error-${Date.now()}`,
          symbol: order.symbol,
          side: order.side,
          amount: order.amount,
          price: 0,
          status: "failed",
          timestamp: Date.now(),
          message: error instanceof Error ? error.message : "Erreur inconnue",
        };
      }
    }
  } catch (error) {
    console.error("Erreur lors du placement de l'ordre:", error);
    return {
      orderId: `error-${Date.now()}`,
      symbol: order.symbol,
      side: order.side,
      amount: order.amount,
      price: 0,
      status: "failed",
      timestamp: Date.now(),
      message: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Calculer le montant maximum que l'on peut acheter avec le solde disponible
 */
export async function calculateMaxBuyAmount(
  symbol: string,
  availableBalance: number
): Promise<number> {
  try {
    const priceInfo = await getCurrentPrice(symbol);
    const maxAmount = availableBalance / priceInfo.price;
    // Arrondir à 8 décimales pour les cryptos
    return Math.floor(maxAmount * 100000000) / 100000000;
  } catch (error) {
    console.error("Erreur lors du calcul du montant maximum:", error);
    return 0;
  }
}

/**
 * Vérifier si un ordre est valide avant de le placer
 */
export function validateOrder(order: TradeOrder, availableBalance: number): {
  valid: boolean;
  error?: string;
} {
  // Vérifier que le montant est positif
  if (order.amount <= 0) {
    return { valid: false, error: "Le montant doit être supérieur à 0" };
  }

  // Pour un ordre d'achat, vérifier le solde disponible
  if (order.side === "buy") {
    const estimatedCost = order.amount * (order.price || 0);
    if (estimatedCost > availableBalance) {
      return { valid: false, error: "Solde insuffisant pour cet ordre" };
    }
  }

  // Pour un ordre limite, vérifier que le prix est défini
  if (order.type === "limit" && !order.price) {
    return { valid: false, error: "Le prix doit être défini pour un ordre limite" };
  }

  return { valid: true };
}

export default {
  getAccountBalances,
  getCurrentPrice,
  placeOrder,
  calculateMaxBuyAmount,
  validateOrder,
};
