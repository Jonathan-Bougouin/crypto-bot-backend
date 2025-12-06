/**
 * Service de gestion du portefeuille Paper Trading
 * Permet de simuler un portefeuille virtuel pour tester les stratégies sans risque
 */

interface PaperPortfolio {
  cash: number; // Solde en EUR
  positions: {
    [symbol: string]: {
      quantity: number;
      avgPrice: number;
      totalInvested: number;
    };
  };
  history: PaperTrade[];
}

interface PaperTrade {
  id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  cashBefore: number;
  cashAfter: number;
}

// Portefeuille initial par défaut
const DEFAULT_PORTFOLIO: PaperPortfolio = {
  cash: 50.0, // Capital initial de 50€
  positions: {},
  history: [],
};

// Stockage en mémoire du portefeuille (en production, utiliser une base de données)
let paperPortfolio: PaperPortfolio = { ...DEFAULT_PORTFOLIO };

/**
 * Récupérer le portefeuille Paper Trading actuel
 */
export function getPaperPortfolio(): PaperPortfolio {
  return { ...paperPortfolio };
}

/**
 * Réinitialiser le portefeuille Paper Trading
 */
export function resetPaperPortfolio(initialCash: number = 50.0): PaperPortfolio {
  paperPortfolio = {
    cash: initialCash,
    positions: {},
    history: [],
  };
  return getPaperPortfolio();
}

/**
 * Exécuter un trade en mode Paper Trading
 */
export function executePaperTrade(
  symbol: string,
  side: "buy" | "sell",
  quantity: number,
  price: number
): {
  success: boolean;
  message?: string;
  trade?: PaperTrade;
  portfolio?: PaperPortfolio;
} {
  const total = quantity * price;

  // Validation pour un achat
  if (side === "buy") {
    if (total > paperPortfolio.cash) {
      return {
        success: false,
        message: `Solde insuffisant. Disponible: ${paperPortfolio.cash.toFixed(2)}€, Requis: ${total.toFixed(2)}€`,
      };
    }

    // Déduire le montant du cash
    const cashBefore = paperPortfolio.cash;
    paperPortfolio.cash -= total;

    // Ajouter ou mettre à jour la position
    if (!paperPortfolio.positions[symbol]) {
      paperPortfolio.positions[symbol] = {
        quantity: 0,
        avgPrice: 0,
        totalInvested: 0,
      };
    }

    const position = paperPortfolio.positions[symbol];
    const newTotalInvested = position.totalInvested + total;
    const newQuantity = position.quantity + quantity;
    position.avgPrice = newTotalInvested / newQuantity;
    position.quantity = newQuantity;
    position.totalInvested = newTotalInvested;

    // Enregistrer le trade dans l'historique
    const trade: PaperTrade = {
      id: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      symbol,
      side,
      quantity,
      price,
      total,
      cashBefore,
      cashAfter: paperPortfolio.cash,
    };
    paperPortfolio.history.push(trade);

    return {
      success: true,
      message: `Achat de ${quantity} ${symbol} @ ${price.toFixed(8)}€`,
      trade,
      portfolio: getPaperPortfolio(),
    };
  }

  // Validation pour une vente
  if (side === "sell") {
    const position = paperPortfolio.positions[symbol];
    if (!position || position.quantity < quantity) {
      return {
        success: false,
        message: `Position insuffisante. Disponible: ${position?.quantity || 0}, Requis: ${quantity}`,
      };
    }

    // Ajouter le montant au cash
    const cashBefore = paperPortfolio.cash;
    paperPortfolio.cash += total;

    // Mettre à jour la position
    position.quantity -= quantity;
    position.totalInvested -= quantity * position.avgPrice;

    // Si la position est entièrement vendue, la supprimer
    if (position.quantity === 0) {
      delete paperPortfolio.positions[symbol];
    }

    // Enregistrer le trade dans l'historique
    const trade: PaperTrade = {
      id: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      symbol,
      side,
      quantity,
      price,
      total,
      cashBefore,
      cashAfter: paperPortfolio.cash,
    };
    paperPortfolio.history.push(trade);

    return {
      success: true,
      message: `Vente de ${quantity} ${symbol} @ ${price.toFixed(8)}€`,
      trade,
      portfolio: getPaperPortfolio(),
    };
  }

  return {
    success: false,
    message: "Type d'ordre invalide",
  };
}

/**
 * Calculer la valeur totale du portefeuille Paper Trading
 */
export async function calculatePaperPortfolioValue(
  currentPrices: { [symbol: string]: number }
): Promise<{
  cash: number;
  positionsValue: number;
  totalValue: number;
  positions: {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
  }[];
}> {
  const positions = Object.entries(paperPortfolio.positions).map(([symbol, position]) => {
    const currentPrice = currentPrices[symbol] || 0;
    const currentValue = position.quantity * currentPrice;
    const profitLoss = currentValue - position.totalInvested;
    const profitLossPercent = (profitLoss / position.totalInvested) * 100;

    return {
      symbol,
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  });

  const positionsValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalValue = paperPortfolio.cash + positionsValue;

  return {
    cash: paperPortfolio.cash,
    positionsValue,
    totalValue,
    positions,
  };
}

/**
 * Obtenir l'historique des trades Paper Trading
 */
export function getPaperTradeHistory(limit: number = 100): PaperTrade[] {
  return paperPortfolio.history.slice(-limit).reverse();
}

/**
 * Calculer les statistiques de performance du Paper Trading
 */
export function getPaperTradingStats(): {
  totalTrades: number;
  buyTrades: number;
  sellTrades: number;
  initialCapital: number;
  currentCash: number;
  totalInvested: number;
  roi: number;
} {
  const totalTrades = paperPortfolio.history.length;
  const buyTrades = paperPortfolio.history.filter((t) => t.side === "buy").length;
  const sellTrades = paperPortfolio.history.filter((t) => t.side === "sell").length;
  const initialCapital = DEFAULT_PORTFOLIO.cash;
  const currentCash = paperPortfolio.cash;
  const totalInvested = Object.values(paperPortfolio.positions).reduce(
    (sum, pos) => sum + pos.totalInvested,
    0
  );
  const roi = ((currentCash + totalInvested - initialCapital) / initialCapital) * 100;

  return {
    totalTrades,
    buyTrades,
    sellTrades,
    initialCapital,
    currentCash,
    totalInvested,
    roi,
  };
}

export default {
  getPaperPortfolio,
  resetPaperPortfolio,
  executePaperTrade,
  calculatePaperPortfolioValue,
  getPaperTradeHistory,
  getPaperTradingStats,
};
