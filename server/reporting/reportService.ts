import { AutonomousBot } from '../ai/bot/autonomousBot';
import { sentimentAnalyzer } from '../ai/ml/sentimentAnalyzer';

export interface ReportStats {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  startingCapital: number;
  endingCapital: number;
  profit: number;
  profitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  bestTrade: { symbol: string; profit: number; percent: number } | null;
  worstTrade: { symbol: string; profit: number; percent: number } | null;
}

export class ReportService {
  private bot: AutonomousBot;

  constructor(bot: AutonomousBot) {
    this.bot = bot;
  }

  /**
   * Générer un rapport pour une période donnée
   */
  async generateReport(period: 'daily' | 'weekly' | 'monthly'): Promise<ReportStats> {
    const endDate = new Date();
    const startDate = new Date();
    
    // Définir la date de début en fonction de la période
    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Récupérer l'historique des trades (simulé pour l'instant, à connecter à la BDD)
    // Dans une version réelle, on ferait une requête SQL ici
    const stats = this.bot.getStats();
    const positions = this.bot.getPositions(); // Idéalement filtrer par date

    // Calculs (simplifiés pour l'exemple)
    const startingCapital = stats.totalCapital; // À ajuster avec l'historique
    const endingCapital = stats.totalCapital; // + profits non réalisés
    const profit = 0; // À calculer
    const profitPercent = 0;

    return {
      period,
      startDate,
      endDate,
      startingCapital,
      endingCapital,
      profit,
      profitPercent,
      totalTrades: stats.dailyTrades, // À ajuster
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      bestTrade: null,
      worstTrade: null
    };
  }

  /**
   * Formater le rapport en texte pour l'envoi (Email/Telegram)
   */
  formatReportText(report: ReportStats): string {
    const icon = report.profit >= 0 ? '🟢' : '🔴';
    const periodName = {
      'daily': 'Journalier',
      'weekly': 'Hebdomadaire',
      'monthly': 'Mensuel'
    }[report.period];

    return `
${icon} **Rapport de Trading ${periodName}**
📅 ${report.startDate.toLocaleDateString()} - ${report.endDate.toLocaleDateString()}

💰 **Capital**: ${report.endingCapital.toFixed(2)}€
📈 **Résultat**: ${report.profit > 0 ? '+' : ''}${report.profit.toFixed(2)}€ (${report.profitPercent.toFixed(2)}%)

📊 **Statistiques**:
• Trades: ${report.totalTrades}
• Gagnants: ${report.winningTrades} (${report.winRate.toFixed(1)}%)
• Perdants: ${report.losingTrades}

🏆 **Meilleur Trade**: ${report.bestTrade ? `${report.bestTrade.symbol} (+${report.bestTrade.percent.toFixed(2)}%)` : 'N/A'}
⚠️ **Pire Trade**: ${report.worstTrade ? `${report.worstTrade.symbol} (${report.worstTrade.percent.toFixed(2)}%)` : 'N/A'}

🤖 **IA Feedback**:
Le modèle a appris de ${report.totalTrades} nouvelles situations.
Confiance actuelle du marché: ${(sentimentAnalyzer.getConfidenceScore({ score: 0, magnitude: 0, sources: { twitter: 0, reddit: 0, news: 0 }, keywords: [] }) * 100).toFixed(0)}%
    `.trim();
  }

  /**
   * Planifier l'envoi automatique des rapports
   */
  scheduleReports(): void {
    // Rapport Journalier à 23h59
    this.scheduleDaily();
    
    // Rapport Hebdo le Dimanche à 23h59
    this.scheduleWeekly();
    
    // Rapport Mensuel le dernier jour du mois
    this.scheduleMonthly();
    
    console.log('📅 Rapports automatiques planifiés');
  }

  private scheduleDaily() {
    // Implémentation simple avec setInterval pour l'exemple
    // Dans la réalité, utiliser node-cron
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59) {
        this.generateReport('daily').then(report => {
          console.log(this.formatReportText(report));
          // Ici: Envoyer par email/Telegram
        });
      }
    }, 60000);
  }

  private scheduleWeekly() {
    // ...
  }

  private scheduleMonthly() {
    // ...
  }
}
