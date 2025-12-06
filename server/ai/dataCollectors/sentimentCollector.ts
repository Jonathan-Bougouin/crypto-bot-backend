/**
 * Collecteur de sentiment depuis les réseaux sociaux et news
 * 
 * Sources :
 * - Twitter/X (via API ou scraping)
 * - Reddit (r/cryptocurrency, r/bitcoin, r/ethereum)
 * - News crypto (CoinDesk, CoinTelegraph)
 * - Fear & Greed Index
 */

export interface SentimentData {
  symbol: string;
  timestamp: number;
  
  // Scores de sentiment (-1 à +1)
  overallSentiment: number;
  twitterSentiment: number;
  redditSentiment: number;
  newsSentiment: number;
  
  // Métriques sociales
  twitterMentions: number;
  redditPosts: number;
  newsArticles: number;
  
  // Trending
  isTrending: boolean;
  trendingScore: number;
  
  // Fear & Greed
  fearGreedIndex: number; // 0-100
}

export interface SocialPost {
  platform: 'twitter' | 'reddit' | 'news';
  text: string;
  author: string;
  timestamp: number;
  likes: number;
  shares: number;
  sentiment: number; // -1 à +1
}

/**
 * Collecteur de sentiment
 */
export class SentimentCollector {
  private symbols: string[];
  private updateInterval: number;
  
  constructor(symbols: string[], updateInterval: number = 300000) { // 5 minutes
    this.symbols = symbols;
    this.updateInterval = updateInterval;
  }
  
  /**
   * Mettre à jour la liste des symboles surveillés
   */
  updateSymbols(newSymbols: string[]): void {
    console.log(`💬 Mise à jour des symboles de sentiment : ${this.symbols.length} -> ${newSymbols.length}`);
    this.symbols = newSymbols;
  }
  
  /**
   * Collecter le sentiment pour un symbole
   */
  async collectSentiment(symbol: string): Promise<SentimentData> {
    try {
      // Extraire le nom de la crypto (ex: BTC-USD -> BTC)
      const cryptoName = symbol.split('-')[0];
      
      // Collecter depuis différentes sources
      const [twitter, reddit, news, fearGreed] = await Promise.allSettled([
        this.collectTwitterSentiment(cryptoName),
        this.collectRedditSentiment(cryptoName),
        this.collectNewsSentiment(cryptoName),
        this.getFearGreedIndex()
      ]);
      
      const twitterData = twitter.status === 'fulfilled' ? twitter.value : { sentiment: 0, mentions: 0 };
      const redditData = reddit.status === 'fulfilled' ? reddit.value : { sentiment: 0, posts: 0 };
      const newsData = news.status === 'fulfilled' ? news.value : { sentiment: 0, articles: 0 };
      const fearGreedData = fearGreed.status === 'fulfilled' ? fearGreed.value : 50;
      
      // Calculer le sentiment global (moyenne pondérée)
      const overallSentiment = (
        twitterData.sentiment * 0.4 +
        redditData.sentiment * 0.3 +
        newsData.sentiment * 0.3
      );
      
      // Calculer le trending score
      const trendingScore = (
        twitterData.mentions * 0.5 +
        redditData.posts * 0.3 +
        newsData.articles * 0.2
      );
      
      const sentimentData: SentimentData = {
        symbol,
        timestamp: Date.now(),
        overallSentiment,
        twitterSentiment: twitterData.sentiment,
        redditSentiment: redditData.sentiment,
        newsSentiment: newsData.sentiment,
        twitterMentions: twitterData.mentions,
        redditPosts: redditData.posts,
        newsArticles: newsData.articles,
        isTrending: trendingScore > 100, // Seuil arbitraire
        trendingScore,
        fearGreedIndex: fearGreedData
      };
      
      return sentimentData;
    } catch (error) {
      console.error(`Error collecting sentiment for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Collecter le sentiment Twitter/X
   */
  private async collectTwitterSentiment(crypto: string): Promise<{ sentiment: number; mentions: number }> {
    // TODO: Implémenter l'API Twitter ou scraping
    // Pour l'instant, simulation avec données aléatoires
    
    try {
      // Simulation de données Twitter
      const mentions = Math.floor(Math.random() * 1000);
      const sentiment = (Math.random() * 2) - 1; // -1 à +1
      
      return { sentiment, mentions };
    } catch (error) {
      console.error('Error collecting Twitter sentiment:', error);
      return { sentiment: 0, mentions: 0 };
    }
  }
  
  /**
   * Collecter le sentiment Reddit
   */
  private async collectRedditSentiment(crypto: string): Promise<{ sentiment: number; posts: number }> {
    // TODO: Implémenter l'API Reddit
    // Pour l'instant, simulation
    
    try {
      const posts = Math.floor(Math.random() * 500);
      const sentiment = (Math.random() * 2) - 1;
      
      return { sentiment, posts };
    } catch (error) {
      console.error('Error collecting Reddit sentiment:', error);
      return { sentiment: 0, posts: 0 };
    }
  }
  
  /**
   * Collecter le sentiment des news
   */
  private async collectNewsSentiment(crypto: string): Promise<{ sentiment: number; articles: number }> {
    // TODO: Implémenter l'API News ou scraping
    // Pour l'instant, simulation
    
    try {
      const articles = Math.floor(Math.random() * 100);
      const sentiment = (Math.random() * 2) - 1;
      
      return { sentiment, articles };
    } catch (error) {
      console.error('Error collecting news sentiment:', error);
      return { sentiment: 0, articles: 0 };
    }
  }
  
  /**
   * Récupérer le Fear & Greed Index
   */
  private async getFearGreedIndex(): Promise<number> {
    try {
      // API publique pour le Fear & Greed Index
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      
      if (data && data.data && data.data[0]) {
        return parseInt(data.data[0].value);
      }
      
      return 50; // Neutre par défaut
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
      return 50;
    }
  }
  
  /**
   * Analyser le sentiment d'un texte
   * Utilise une approche simple basée sur des mots-clés
   * TODO: Remplacer par un modèle NLP (BERT/DistilBERT)
   */
  analyzeSentiment(text: string): number {
    const positiveWords = [
      'bullish', 'moon', 'pump', 'buy', 'long', 'profit', 'gain',
      'up', 'rise', 'surge', 'rally', 'breakout', 'ATH', 'green'
    ];
    
    const negativeWords = [
      'bearish', 'dump', 'sell', 'short', 'loss', 'crash', 'down',
      'fall', 'drop', 'decline', 'correction', 'red', 'fear'
    ];
    
    const lowerText = text.toLowerCase();
    
    let score = 0;
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.1;
    });
    
    // Normaliser entre -1 et 1
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * Collecter pour tous les symboles
   */
  async collectAllSymbols(): Promise<SentimentData[]> {
    const promises = this.symbols.map(symbol => this.collectSentiment(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<SentimentData> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }
  
  /**
   * Démarrer la collecte en continu
   */
  startContinuousCollection(callback: (data: SentimentData[]) => void): NodeJS.Timeout {
    const interval = setInterval(async () => {
      try {
        const data = await this.collectAllSymbols();
        callback(data);
      } catch (error) {
        console.error('Error in continuous sentiment collection:', error);
      }
    }, this.updateInterval);
    
    // Collecter immédiatement au démarrage
    this.collectAllSymbols().then(callback).catch(console.error);
    
    return interval;
  }
  
  /**
   * Arrêter la collecte
   */
  stopCollection(interval: NodeJS.Timeout): void {
    clearInterval(interval);
  }
}

export default SentimentCollector;
