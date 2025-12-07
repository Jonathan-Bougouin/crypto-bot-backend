/**
 * Module de Transfer Learning pour l'Analyse de Sentiment
 * 
 * Utilise des modèles pré-entraînés (simulés ici) pour accélérer l'apprentissage
 * du bot sur l'interprétation des news et tweets crypto.
 */

// Simulation d'un modèle BERT/RoBERTa pré-entraîné sur des tweets financiers
// Dans une vraie implémentation, on chargerait un modèle ONNX ou TensorFlow.js
export class SentimentTransferModel {
  private static instance: SentimentTransferModel;
  
  // Dictionnaire de mots-clés pondérés (Transfer Learning "Lite")
  // Ces poids proviennent d'un entraînement sur 1M+ tweets crypto (simulé)
  private readonly PRE_TRAINED_WEIGHTS: Record<string, number> = {
    'moon': 0.8,
    'lambo': 0.7,
    'gem': 0.6,
    'pump': 0.5,
    'bullish': 0.6,
    'breakout': 0.7,
    'ath': 0.9,
    'partnership': 0.8,
    'listing': 0.8,
    'mainnet': 0.7,
    'burn': 0.6,
    
    'scam': -0.9,
    'rug': -0.9,
    'hack': -1.0,
    'dump': -0.7,
    'bearish': -0.6,
    'crash': -0.8,
    'ban': -0.8,
    'regulation': -0.4,
    'sell': -0.5,
    'fud': -0.3,
  };

  private constructor() {}

  public static getInstance(): SentimentTransferModel {
    if (!SentimentTransferModel.instance) {
      SentimentTransferModel.instance = new SentimentTransferModel();
    }
    return SentimentTransferModel.instance;
  }

  /**
   * Analyse le sentiment d'un texte en utilisant la connaissance transférée
   * @param text Texte à analyser (Tweet, Titre de news)
   * @returns Score de sentiment (-1 à 1) et confiance (0 à 1)
   */
  public analyze(text: string): { score: number; confidence: number } {
    const tokens = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let matchCount = 0;
    
    // Détection d'amplificateurs
    const hasAmplifier = text.includes('!') || text.toUpperCase() === text;
    const amplifierMultiplier = hasAmplifier ? 1.2 : 1.0;

    tokens.forEach(token => {
      // Nettoyage basique
      const cleanToken = token.replace(/[^a-z0-9]/g, '');
      
      if (this.PRE_TRAINED_WEIGHTS[cleanToken]) {
        totalScore += this.PRE_TRAINED_WEIGHTS[cleanToken];
        matchCount++;
      }
    });

    if (matchCount === 0) {
      return { score: 0, confidence: 0 };
    }

    // Normalisation
    let normalizedScore = (totalScore / matchCount) * amplifierMultiplier;
    normalizedScore = Math.max(-1, Math.min(1, normalizedScore));
    
    // La confiance dépend du nombre de mots-clés reconnus
    const confidence = Math.min(0.95, matchCount * 0.15);

    return { score: normalizedScore, confidence };
  }

  /**
   * Fine-tuning (Apprentissage continu)
   * Permet au bot d'ajuster les poids basés sur ses propres observations
   * @param text Texte analysé
   * @param actualOutcome Résultat réel du marché (ex: +5% après 1h = positif)
   */
  public fineTune(text: string, actualOutcome: number): void {
    // Dans une version avancée, on mettrait à jour les poids ici
    // Pour l'instant, on log juste l'écart pour analyse future
    const prediction = this.analyze(text);
    const error = Math.abs(prediction.score - actualOutcome);
    
    if (error > 0.5) {
      console.log(`[TransferLearning] Fine-tuning needed for: "${text.substring(0, 30)}..." (Pred: ${prediction.score}, Actual: ${actualOutcome})`);
    }
  }
}
