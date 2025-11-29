/**
 * Module de calcul des indicateurs techniques pour l'analyse de trading
 */

import { OHLCData } from './coinGeckoService';

/**
 * Calcule le RSI (Relative Strength Index)
 * @param prices Array de prix de clôture
 * @param period Période de calcul (par défaut 14)
 * @returns Valeur du RSI (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    throw new Error(`Not enough data points for RSI calculation. Need at least ${period + 1}, got ${prices.length}`);
  }

  // Calculer les gains et pertes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Séparer les gains et les pertes
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  // Calculer les moyennes des gains et pertes sur la période
  const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;

  if (avgLoss === 0) {
    return 100; // Pas de pertes = RSI maximum
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calcule les Bandes de Bollinger
 * @param prices Array de prix de clôture
 * @param period Période de calcul (par défaut 20)
 * @param stdDev Nombre d'écarts-types (par défaut 2)
 * @returns Object avec upper, middle, lower bands et la largeur
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
} {
  if (prices.length < period) {
    throw new Error(`Not enough data points for Bollinger Bands. Need at least ${period}, got ${prices.length}`);
  }

  // Prendre les derniers prix pour la période
  const recentPrices = prices.slice(-period);

  // Calculer la moyenne mobile (SMA)
  const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;

  // Calculer l'écart-type
  const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  // Calculer les bandes
  const upper = sma + (stdDev * standardDeviation);
  const lower = sma - (stdDev * standardDeviation);
  const bandwidth = (upper - lower) / sma; // Largeur relative des bandes

  return {
    upper,
    middle: sma,
    lower,
    bandwidth,
  };
}

/**
 * Détecte un spike de volume (volume anormalement élevé)
 * @param volumes Array de volumes
 * @param threshold Multiplicateur du volume moyen (par défaut 2.0)
 * @returns true si spike détecté
 */
export function detectVolumeSpike(volumes: number[], threshold: number = 2.0): {
  isSpike: boolean;
  currentVolume: number;
  avgVolume: number;
  ratio: number;
} {
  if (volumes.length < 2) {
    return {
      isSpike: false,
      currentVolume: volumes[0] || 0,
      avgVolume: volumes[0] || 0,
      ratio: 1,
    };
  }

  const currentVolume = volumes[volumes.length - 1];
  const historicalVolumes = volumes.slice(0, -1);
  const avgVolume = historicalVolumes.reduce((sum, v) => sum + v, 0) / historicalVolumes.length;

  const ratio = avgVolume > 0 ? currentVolume / avgVolume : 1;
  const isSpike = ratio >= threshold;

  return {
    isSpike,
    currentVolume,
    avgVolume,
    ratio,
  };
}

/**
 * Détecte un Bollinger Squeeze (compression des bandes)
 * Indique une période de faible volatilité qui précède souvent un mouvement important
 * @param bandwidths Array des largeurs de bandes historiques
 * @param threshold Seuil de compression (par défaut 0.05 = 5%)
 * @returns true si squeeze détecté
 */
export function detectBollingerSqueeze(bandwidths: number[], threshold: number = 0.05): {
  isSqueeze: boolean;
  currentBandwidth: number;
  avgBandwidth: number;
} {
  if (bandwidths.length < 2) {
    return {
      isSqueeze: false,
      currentBandwidth: bandwidths[0] || 0,
      avgBandwidth: bandwidths[0] || 0,
    };
  }

  const currentBandwidth = bandwidths[bandwidths.length - 1];
  const avgBandwidth = bandwidths.reduce((sum, bw) => sum + bw, 0) / bandwidths.length;

  const isSqueeze = currentBandwidth < threshold;

  return {
    isSqueeze,
    currentBandwidth,
    avgBandwidth,
  };
}

/**
 * Détecte un breakout des Bollinger Bands
 * @param currentPrice Prix actuel
 * @param bollingerBands Bandes de Bollinger calculées
 * @returns Type de breakout ('upper', 'lower', 'none')
 */
export function detectBollingerBreakout(
  currentPrice: number,
  bollingerBands: { upper: number; middle: number; lower: number }
): 'upper' | 'lower' | 'none' {
  if (currentPrice > bollingerBands.upper) {
    return 'upper';
  } else if (currentPrice < bollingerBands.lower) {
    return 'lower';
  }
  return 'none';
}

/**
 * Analyse complète des indicateurs techniques pour un actif
 * @param ohlcData Données OHLC historiques
 * @param currentPrice Prix actuel
 * @param currentVolume Volume actuel
 * @returns Analyse complète avec tous les indicateurs
 */
export function analyzeMarketData(
  ohlcData: OHLCData[],
  currentPrice: number,
  currentVolume: number
): {
  rsi: number;
  bollingerBands: ReturnType<typeof calculateBollingerBands>;
  volumeSpike: ReturnType<typeof detectVolumeSpike>;
  bollingerBreakout: 'upper' | 'lower' | 'none';
  signals: string[];
} {
  const closePrices = ohlcData.map(d => d.close);
  const volumes = ohlcData.map(d => currentVolume); // Simplification: utiliser le volume actuel

  // Calculer les indicateurs
  const rsi = calculateRSI(closePrices);
  const bollingerBands = calculateBollingerBands(closePrices);
  const volumeSpike = detectVolumeSpike([...volumes, currentVolume]);
  const bollingerBreakout = detectBollingerBreakout(currentPrice, bollingerBands);

  // Générer les signaux
  const signals: string[] = [];

  if (volumeSpike.isSpike) {
    signals.push(`Volume Spike (Volume ${volumeSpike.currentVolume.toFixed(2)} > Moyenne ${volumeSpike.avgVolume.toFixed(2)} * 2.0)`);
  }

  if (bollingerBreakout === 'upper') {
    signals.push(`Bollinger Band Breakout (Le prix a cassé la bande supérieure)`);
  } else if (bollingerBreakout === 'lower') {
    signals.push(`Bollinger Band Breakdown (Le prix a cassé la bande inférieure)`);
  }

  if (bollingerBands.bandwidth < 0.05) {
    signals.push(`Bollinger Band Squeeze (Volatilité très faible, mouvement imminent)`);
  }

  if (rsi < 30) {
    signals.push(`RSI < 30 (Oversold, potentiel de rebond)`);
  } else if (rsi > 70) {
    signals.push(`RSI > 70 (Overbought, potentiel de correction)`);
  }

  return {
    rsi,
    bollingerBands,
    volumeSpike,
    bollingerBreakout,
    signals,
  };
}
