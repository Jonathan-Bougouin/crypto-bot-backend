/**
 * Gestionnaire Multi-Tenant pour les Bots de Trading
 * 
 * Gère plusieurs bots de trading simultanément, un par client
 * Assure l'isolation des données et la gestion des ressources
 */

import { AutonomousBot, BotConfig, Strategy } from '../ai/bot/autonomousBot';
import { TradingModel } from '../ai/ml/tradingModel';
import { DataManager, getDataManager } from '../ai/dataCollectors/dataManager';

export interface ClientBotInstance {
  userId: string;
  bot: AutonomousBot;
  tradingModel: TradingModel;
  config: BotConfig;
  
  // Métadonnées
  createdAt: Date;
  lastActivity: Date;
  
  // Ressources
  memoryUsage: number; // MB
  cpuUsage: number; // %
  
  // Statut
  isRunning: boolean;
  errors: string[];
}

export interface BotManagerConfig {
  maxBotsPerServer: number;
  maxMemoryPerBot: number; // MB
  maxCpuPerBot: number; // %
  checkInterval: number; // ms
}

/**
 * Gestionnaire de bots multi-tenant
 */
export class BotManager {
  private config: BotManagerConfig;
  private bots: Map<string, ClientBotInstance>;
  private dataManager: DataManager;
  private monitoringInterval?: NodeJS.Timeout;
  
  constructor(config: BotManagerConfig) {
    this.config = config;
    this.bots = new Map();
    
    // Initialiser le gestionnaire de données partagé
    // Configuration optimisée pour le Top 500 (Mode VPS)
    this.dataManager = getDataManager({
      symbols: [], // Sera rempli dynamiquement
      marketUpdateInterval: 30000, // 30 secondes
      sentimentUpdateInterval: 300000, // 5 minutes
      enableMarketData: true,
      enableSentimentData: true,
      useTop500: true, // Activation du mode Top 500
    });
    
    // Démarrer le gestionnaire de données
    this.dataManager.start();
  }
  
  /**
   * Créer un bot pour un client
   */
  async createBot(userId: string, botConfig: BotConfig): Promise<ClientBotInstance> {
    // Vérifier si le bot existe déjà
    if (this.bots.has(userId)) {
      throw new Error(`Bot already exists for user ${userId}`);
    }
    
    // Vérifier la limite de bots
    if (this.bots.size >= this.config.maxBotsPerServer) {
      throw new Error(`Maximum number of bots reached (${this.config.maxBotsPerServer})`);
    }
    
    // Créer le modèle de trading
    const tradingModel = new TradingModel();
    
    // Créer le bot autonome
    const bot = new AutonomousBot(botConfig, tradingModel, this.dataManager);
    
    // Créer l'instance client
    const instance: ClientBotInstance = {
      userId,
      bot,
      tradingModel,
      config: botConfig,
      createdAt: new Date(),
      lastActivity: new Date(),
      memoryUsage: 0,
      cpuUsage: 0,
      isRunning: false,
      errors: [],
    };
    
    // Ajouter au registre
    this.bots.set(userId, instance);
    
    console.log(`✅ Bot créé pour l'utilisateur ${userId}`);
    
    return instance;
  }
  
  /**
   * Démarrer un bot
   */
  async startBot(userId: string): Promise<void> {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    if (instance.isRunning) {
      throw new Error(`Bot already running for user ${userId}`);
    }
    
    try {
      instance.bot.start();
      instance.isRunning = true;
      instance.lastActivity = new Date();
      
      console.log(`🚀 Bot démarré pour l'utilisateur ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      instance.errors.push(errorMessage);
      throw error;
    }
  }
  
  /**
   * Arrêter un bot
   */
  async stopBot(userId: string): Promise<void> {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    if (!instance.isRunning) {
      throw new Error(`Bot not running for user ${userId}`);
    }
    
    try {
      instance.bot.stop();
      instance.isRunning = false;
      instance.lastActivity = new Date();
      
      console.log(`🛑 Bot arrêté pour l'utilisateur ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      instance.errors.push(errorMessage);
      throw error;
    }
  }
  
  /**
   * Mettre à jour la configuration d'un bot
   */
  async updateBotConfig(userId: string, newConfig: Partial<BotConfig>): Promise<void> {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    // Fusionner les configurations
    instance.config = {
      ...instance.config,
      ...newConfig,
    };
    
    // Si le bot est en cours d'exécution, le redémarrer avec la nouvelle config
    if (instance.isRunning) {
      await this.stopBot(userId);
      
      // Créer un nouveau bot avec la nouvelle config
      const tradingModel = instance.tradingModel;
      const newBot = new AutonomousBot(instance.config, tradingModel, this.dataManager);
      instance.bot = newBot;
      
      await this.startBot(userId);
    }
    
    instance.lastActivity = new Date();
    
    console.log(`🔄 Configuration mise à jour pour l'utilisateur ${userId}`);
  }
  
  /**
   * Supprimer un bot
   */
  async deleteBot(userId: string): Promise<void> {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    // Arrêter le bot s'il est en cours d'exécution
    if (instance.isRunning) {
      await this.stopBot(userId);
    }
    
    // Supprimer du registre
    this.bots.delete(userId);
    
    console.log(`🗑️  Bot supprimé pour l'utilisateur ${userId}`);
  }
  
  /**
   * Obtenir un bot
   */
  getBot(userId: string): ClientBotInstance | undefined {
    return this.bots.get(userId);
  }
  
  /**
   * Obtenir tous les bots
   */
  getAllBots(): ClientBotInstance[] {
    return Array.from(this.bots.values());
  }
  
  /**
   * Obtenir les statistiques d'un bot
   */
  getBotStats(userId: string): any {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    return instance.bot.getStats();
  }
  
  /**
   * Obtenir les positions d'un bot
   */
  getBotPositions(userId: string): any[] {
    const instance = this.bots.get(userId);
    
    if (!instance) {
      throw new Error(`Bot not found for user ${userId}`);
    }
    
    return instance.bot.getPositions();
  }
  
  /**
   * Démarrer le monitoring des bots
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('⚠️  Monitoring already started');
      return;
    }
    
    this.monitoringInterval = setInterval(() => {
      this.checkBots();
    }, this.config.checkInterval);
    
    console.log('👁️  Monitoring des bots démarré');
  }
  
  /**
   * Arrêter le monitoring des bots
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('👁️  Monitoring des bots arrêté');
    }
  }
  
  /**
   * Vérifier l'état des bots
   */
  private checkBots(): void {
    this.bots.forEach((instance, userId) => {
      try {
        // Vérifier l'utilisation de la mémoire
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        instance.memoryUsage = memUsage / this.bots.size; // Approximation
        
        if (instance.memoryUsage > this.config.maxMemoryPerBot) {
          console.warn(`⚠️  Bot ${userId} utilise trop de mémoire: ${instance.memoryUsage.toFixed(2)}MB`);
          instance.errors.push(`Memory usage too high: ${instance.memoryUsage.toFixed(2)}MB`);
        }
        
        // TODO: Vérifier l'utilisation du CPU
        // Nécessite un package comme 'pidusage'
        
        // Vérifier l'activité
        const inactiveTime = Date.now() - instance.lastActivity.getTime();
        const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 heures
        
        if (inactiveTime > maxInactiveTime && instance.isRunning) {
          console.warn(`⚠️  Bot ${userId} inactif depuis ${inactiveTime / 1000 / 60 / 60}h`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la vérification du bot ${userId}:`, error);
      }
    });
  }
  
  /**
   * Obtenir les statistiques globales
   */
  getGlobalStats(): {
    totalBots: number;
    runningBots: number;
    stoppedBots: number;
    totalMemoryUsage: number;
    averageMemoryPerBot: number;
    botsWithErrors: number;
  } {
    const bots = this.getAllBots();
    
    return {
      totalBots: bots.length,
      runningBots: bots.filter(b => b.isRunning).length,
      stoppedBots: bots.filter(b => !b.isRunning).length,
      totalMemoryUsage: bots.reduce((sum, b) => sum + b.memoryUsage, 0),
      averageMemoryPerBot: bots.length > 0 
        ? bots.reduce((sum, b) => sum + b.memoryUsage, 0) / bots.length 
        : 0,
      botsWithErrors: bots.filter(b => b.errors.length > 0).length,
    };
  }
  
  /**
   * Nettoyer les bots inactifs
   */
  async cleanupInactiveBots(maxInactiveHours: number = 72): Promise<number> {
    const maxInactiveTime = maxInactiveHours * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, instance] of Array.from(this.bots.entries())) {
      const inactiveTime = now - instance.lastActivity.getTime();
      
      if (inactiveTime > maxInactiveTime && !instance.isRunning) {
        await this.deleteBot(userId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} bots inactifs nettoyés`);
    }
    
    return cleaned;
  }
  
  /**
   * Arrêter le gestionnaire
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Arrêt du gestionnaire de bots...');
    
    // Arrêter le monitoring
    this.stopMonitoring();
    
    // Arrêter tous les bots
    for (const userId of Array.from(this.bots.keys())) {
      try {
        await this.stopBot(userId);
      } catch (error) {
        console.error(`Erreur lors de l'arrêt du bot ${userId}:`, error);
      }
    }
    
    // Arrêter le gestionnaire de données
    this.dataManager.stop();
    
    console.log('✅ Gestionnaire de bots arrêté');
  }
}

/**
 * Instance singleton du gestionnaire de bots
 */
let botManagerInstance: BotManager | null = null;

/**
 * Obtenir l'instance du gestionnaire de bots
 */
export function getBotManager(config?: BotManagerConfig): BotManager {
  if (!botManagerInstance && config) {
    botManagerInstance = new BotManager(config);
  }
  
  if (!botManagerInstance) {
    throw new Error('BotManager not initialized. Provide a config on first call.');
  }
  
  return botManagerInstance;
}

/**
 * Réinitialiser le gestionnaire de bots
 */
export async function resetBotManager(): Promise<void> {
  if (botManagerInstance) {
    await botManagerInstance.shutdown();
    botManagerInstance = null;
  }
}

export default BotManager;
