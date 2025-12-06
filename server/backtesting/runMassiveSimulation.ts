/**
 * Script de Simulation à Grande Échelle
 * 
 * Simule 1000+ comptes clients sur 6 mois de données
 * pour extraire les métriques de performance réelles du bot
 */

import { BacktestEngine, BacktestConfig, BacktestResult } from './backtestEngine';
import * as fs from 'fs';
import * as path from 'path';

interface SimulationConfig {
  accountCount: number;
  startDate: Date;
  endDate: Date;
  capitalRange: [number, number];
  strategies: string[][];
}

interface AggregatedResults {
  totalAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  
  // Performance globale
  averageReturn: number;
  medianReturn: number;
  bestReturn: number;
  worstReturn: number;
  
  // Distribution des résultats
  profitableAccounts: number;
  breakEvenAccounts: number;
  losingAccounts: number;
  
  // Statistiques de trading
  averageWinRate: number;
  averageTrades: number;
  averageProfitFactor: number;
  
  // Top performers
  topPerformers: BacktestResult[];
  
  // Distribution par capital initial
  resultsByCapital: Record<string, {
    count: number;
    averageReturn: number;
    winRate: number;
  }>;
  
  // Distribution par stratégies
  resultsByStrategy: Record<string, {
    count: number;
    averageReturn: number;
    winRate: number;
  }>;
  
  // Tous les résultats
  allResults: BacktestResult[];
}

/**
 * Exécuter une simulation massive
 */
async function runMassiveSimulation(config: SimulationConfig): Promise<AggregatedResults> {
  console.log('🚀 Démarrage de la simulation massive...');
  console.log(`📊 Paramètres:`);
  console.log(`   - Nombre de comptes: ${config.accountCount}`);
  console.log(`   - Période: ${config.startDate.toLocaleDateString()} - ${config.endDate.toLocaleDateString()}`);
  console.log(`   - Capital: ${config.capitalRange[0]}€ - ${config.capitalRange[1]}€`);
  console.log('');
  
  const engine = new BacktestEngine();
  const results: BacktestResult[] = [];
  
  // Générer les configurations de comptes
  const accountConfigs: Array<{ id: string; config: BacktestConfig }> = [];
  
  for (let i = 0; i < config.accountCount; i++) {
    const capital = Math.floor(
      config.capitalRange[0] + Math.random() * (config.capitalRange[1] - config.capitalRange[0])
    );
    
    const strategies = config.strategies[Math.floor(Math.random() * config.strategies.length)];
    
    accountConfigs.push({
      id: `account_${i + 1}`,
      config: {
        startDate: config.startDate,
        endDate: config.endDate,
        initialCapital: capital,
        strategies,
        maxDailyTrades: 10 + Math.floor(Math.random() * 20),
        maxOpenPositions: 2 + Math.floor(Math.random() * 4),
        riskPerTrade: 1 + Math.random() * 3,
      },
    });
  }
  
  // Exécuter les backtests
  console.log('⏳ Exécution des backtests...');
  const startTime = Date.now();
  
  for (let i = 0; i < accountConfigs.length; i++) {
    const { id, config: accountConfig } = accountConfigs[i];
    
    try {
      const result = await engine.runBacktest(accountConfig, id);
      results.push(result);
      
      // Afficher la progression tous les 100 comptes
      if ((i + 1) % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgTime = elapsed / (i + 1);
        const remaining = (accountConfigs.length - i - 1) * avgTime;
        
        console.log(`   ✓ ${i + 1}/${accountConfigs.length} comptes traités (${Math.floor(remaining)}s restantes)`);
      }
    } catch (error) {
      console.error(`   ✗ Erreur pour ${id}:`, error);
    }
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Simulation terminée en ${totalTime.toFixed(1)}s`);
  console.log('');
  
  // Agréger les résultats
  return aggregateResults(results);
}

/**
 * Agréger les résultats de simulation
 */
function aggregateResults(results: BacktestResult[]): AggregatedResults {
  console.log('📊 Agrégation des résultats...');
  
  const returns = results.map(r => r.totalProfitPercent).sort((a, b) => a - b);
  const winRates = results.map(r => r.winRate);
  const trades = results.map(r => r.totalTrades);
  const profitFactors = results.map(r => r.profitFactor);
  
  // Statistiques globales
  const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const medianReturn = returns[Math.floor(returns.length / 2)];
  const bestReturn = Math.max(...returns);
  const worstReturn = Math.min(...returns);
  
  const profitableAccounts = results.filter(r => r.totalProfit > 0).length;
  const breakEvenAccounts = results.filter(r => r.totalProfit === 0).length;
  const losingAccounts = results.filter(r => r.totalProfit < 0).length;
  
  const averageWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;
  const averageTrades = trades.reduce((a, b) => a + b, 0) / trades.length;
  const averageProfitFactor = profitFactors.reduce((a, b) => a + b, 0) / profitFactors.length;
  
  // Top performers (top 10)
  const topPerformers = [...results]
    .sort((a, b) => b.totalProfitPercent - a.totalProfitPercent)
    .slice(0, 10);
  
  // Distribution par capital initial
  const capitalRanges = [
    { min: 0, max: 100, label: '0-100€' },
    { min: 100, max: 500, label: '100-500€' },
    { min: 500, max: 1000, label: '500-1000€' },
    { min: 1000, max: 5000, label: '1000-5000€' },
    { min: 5000, max: Infinity, label: '5000€+' },
  ];
  
  const resultsByCapital: Record<string, any> = {};
  
  for (const range of capitalRanges) {
    const rangeResults = results.filter(
      r => r.initialCapital >= range.min && r.initialCapital < range.max
    );
    
    if (rangeResults.length > 0) {
      resultsByCapital[range.label] = {
        count: rangeResults.length,
        averageReturn: rangeResults.reduce((sum, r) => sum + r.totalProfitPercent, 0) / rangeResults.length,
        winRate: rangeResults.reduce((sum, r) => sum + r.winRate, 0) / rangeResults.length,
      };
    }
  }
  
  // Distribution par stratégies
  const allStrategies = ['scalping', 'swing', 'trend', 'sentiment'];
  const resultsByStrategy: Record<string, any> = {};
  
  for (const strategy of allStrategies) {
    const strategyResults = results.filter(r => r.config.strategies.includes(strategy));
    
    if (strategyResults.length > 0) {
      resultsByStrategy[strategy] = {
        count: strategyResults.length,
        averageReturn: strategyResults.reduce((sum, r) => sum + r.totalProfitPercent, 0) / strategyResults.length,
        winRate: strategyResults.reduce((sum, r) => sum + r.winRate, 0) / strategyResults.length,
      };
    }
  }
  
  return {
    totalAccounts: results.length,
    successfulAccounts: profitableAccounts,
    failedAccounts: losingAccounts,
    averageReturn,
    medianReturn,
    bestReturn,
    worstReturn,
    profitableAccounts,
    breakEvenAccounts,
    losingAccounts,
    averageWinRate,
    averageTrades,
    averageProfitFactor,
    topPerformers,
    resultsByCapital,
    resultsByStrategy,
    allResults: results,
  };
}

/**
 * Afficher les résultats
 */
function displayResults(results: AggregatedResults): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                  RÉSULTATS DE LA SIMULATION               ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  console.log('📊 STATISTIQUES GLOBALES');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   Comptes simulés:        ${results.totalAccounts}`);
  console.log(`   Comptes rentables:      ${results.profitableAccounts} (${(results.profitableAccounts / results.totalAccounts * 100).toFixed(1)}%)`);
  console.log(`   Comptes perdants:       ${results.failedAccounts} (${(results.failedAccounts / results.totalAccounts * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('💰 PERFORMANCE');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   Retour moyen:           ${results.averageReturn.toFixed(2)}%`);
  console.log(`   Retour médian:          ${results.medianReturn.toFixed(2)}%`);
  console.log(`   Meilleur retour:        ${results.bestReturn.toFixed(2)}%`);
  console.log(`   Pire retour:            ${results.worstReturn.toFixed(2)}%`);
  console.log('');
  
  console.log('📈 TRADING');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   Taux de réussite moyen: ${results.averageWinRate.toFixed(1)}%`);
  console.log(`   Trades moyens:          ${results.averageTrades.toFixed(0)}`);
  console.log(`   Profit Factor moyen:    ${results.averageProfitFactor.toFixed(2)}`);
  console.log('');
  
  console.log('🏆 TOP 10 PERFORMERS');
  console.log('───────────────────────────────────────────────────────────');
  results.topPerformers.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.accountId}: ${result.initialCapital}€ → ${result.finalCapital.toFixed(2)}€ (+${result.totalProfitPercent.toFixed(2)}%)`);
  });
  console.log('');
  
  console.log('💵 PERFORMANCE PAR CAPITAL INITIAL');
  console.log('───────────────────────────────────────────────────────────');
  Object.entries(results.resultsByCapital).forEach(([range, data]: [string, any]) => {
    console.log(`   ${range.padEnd(15)} ${data.count.toString().padStart(4)} comptes | Retour: ${data.averageReturn.toFixed(2).padStart(7)}% | Win Rate: ${data.winRate.toFixed(1).padStart(5)}%`);
  });
  console.log('');
  
  console.log('🎯 PERFORMANCE PAR STRATÉGIE');
  console.log('───────────────────────────────────────────────────────────');
  Object.entries(results.resultsByStrategy).forEach(([strategy, data]: [string, any]) => {
    console.log(`   ${strategy.padEnd(15)} ${data.count.toString().padStart(4)} comptes | Retour: ${data.averageReturn.toFixed(2).padStart(7)}% | Win Rate: ${data.winRate.toFixed(1).padStart(5)}%`);
  });
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Sauvegarder les résultats
 */
function saveResults(results: AggregatedResults, outputDir: string): void {
  console.log('💾 Sauvegarde des résultats...');
  
  // Créer le dossier de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Sauvegarder le résumé
  const summaryPath = path.join(outputDir, 'simulation_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    ...results,
    allResults: undefined, // Ne pas inclure tous les résultats dans le résumé
  }, null, 2));
  
  // Sauvegarder tous les résultats
  const allResultsPath = path.join(outputDir, 'all_results.json');
  fs.writeFileSync(allResultsPath, JSON.stringify(results.allResults, null, 2));
  
  // Sauvegarder les top performers
  const topPerformersPath = path.join(outputDir, 'top_performers.json');
  fs.writeFileSync(topPerformersPath, JSON.stringify(results.topPerformers, null, 2));
  
  console.log(`   ✓ Résumé: ${summaryPath}`);
  console.log(`   ✓ Résultats complets: ${allResultsPath}`);
  console.log(`   ✓ Top performers: ${topPerformersPath}`);
  console.log('');
}

/**
 * Point d'entrée principal
 */
async function main() {
  const config: SimulationConfig = {
    accountCount: 2000, // 2000 comptes pour avoir des statistiques robustes
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-12-01'), // 6 mois
    capitalRange: [50, 5000],
    strategies: [
      ['scalping'],
      ['swing'],
      ['scalping', 'swing'],
      ['scalping', 'swing', 'trend'],
      ['scalping', 'swing', 'trend', 'sentiment'],
    ],
  };
  
  const results = await runMassiveSimulation(config);
  
  displayResults(results);
  
  const outputDir = path.join(__dirname, '../../simulation_results');
  saveResults(results, outputDir);
  
  console.log('✅ Simulation terminée avec succès !');
}

// Exécuter si appelé directement
main().catch(console.error);

export { runMassiveSimulation, aggregateResults, displayResults, saveResults };
