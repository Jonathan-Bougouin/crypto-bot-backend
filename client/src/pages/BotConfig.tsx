/**
 * Page de Configuration du Bot
 * 
 * Permet aux utilisateurs de configurer leur bot de trading
 */

import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  targetGain: string;
  enabled: boolean;
  budget: number;
}

export default function BotConfig() {
  const [config, setConfig] = useState({
    totalCapital: 50,
    paperTrading: true,
    autoTrade: false,
    maxDailyTrades: 10,
    maxOpenPositions: 3,
    riskPerTrade: 2,
  });
  
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: 'scalping',
      name: 'Scalping',
      description: 'Gains rapides 5-10% sur très court terme',
      riskLevel: 'medium',
      targetGain: '5-10%',
      enabled: true,
      budget: 20,
    },
    {
      id: 'swing',
      name: 'Swing Trading',
      description: 'Gains 20-30% sur moyen terme',
      riskLevel: 'medium',
      targetGain: '20-30%',
      enabled: true,
      budget: 20,
    },
    {
      id: 'trend',
      name: 'Trend Following',
      description: 'Gains 50%+ en suivant les tendances',
      riskLevel: 'high',
      targetGain: '50%+',
      enabled: false,
      budget: 0,
    },
    {
      id: 'sentiment',
      name: 'Sentiment Trading',
      description: 'Gains 100%+ sur signaux de sentiment',
      riskLevel: 'very-high',
      targetGain: '100%+',
      enabled: false,
      budget: 0,
    },
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very-high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // TODO: Appeler l'API pour sauvegarder la configuration
      // await trpc.bot.updateConfig.mutate({ config, strategies });
      
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage('✅ Configuration sauvegardée avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
  
  const toggleStrategy = (id: string) => {
    setStrategies(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };
  
  const updateStrategyBudget = (id: string, budget: number) => {
    setStrategies(prev => prev.map(s => 
      s.id === id ? { ...s, budget } : s
    ));
  };
  
  const totalAllocated = strategies.reduce((sum, s) => sum + (s.enabled ? s.budget : 0), 0);
  const remainingBudget = config.totalCapital - totalAllocated;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ Configuration du Bot
          </h1>
          <p className="text-gray-600">
            Configurez votre bot de trading automatisé selon vos préférences
          </p>
        </div>
        
        {/* Configuration Générale */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Configuration Générale
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capital Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital Total (€)
              </label>
              <input
                type="number"
                value={config.totalCapital}
                onChange={(e) => setConfig({ ...config, totalCapital: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                step="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant total disponible pour le trading
              </p>
            </div>
            
            {/* Trades par Jour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trades Maximum par Jour
              </label>
              <input
                type="number"
                value={config.maxDailyTrades}
                onChange={(e) => setConfig({ ...config, maxDailyTrades: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limite de trades par jour
              </p>
            </div>
            
            {/* Positions Ouvertes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Positions Ouvertes Maximum
              </label>
              <input
                type="number"
                value={config.maxOpenPositions}
                onChange={(e) => setConfig({ ...config, maxOpenPositions: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre maximum de positions simultanées
              </p>
            </div>
            
            {/* Risque par Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risque par Trade (%)
              </label>
              <input
                type="number"
                value={config.riskPerTrade}
                onChange={(e) => setConfig({ ...config, riskPerTrade: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0.5"
                max="10"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pourcentage du capital risqué par trade
              </p>
            </div>
          </div>
          
          {/* Switches */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Paper Trading</h3>
                <p className="text-sm text-gray-600">Mode simulation sans argent réel</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, paperTrading: !config.paperTrading })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.paperTrading ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.paperTrading ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Trading Automatique</h3>
                <p className="text-sm text-gray-600">Exécuter les trades automatiquement</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, autoTrade: !config.autoTrade })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.autoTrade ? 'bg-green-600' : 'bg-gray-300'
                }`}
                disabled={!config.paperTrading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.autoTrade ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Stratégies */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              🎯 Stratégies de Trading
            </h2>
            <div className="text-sm">
              <span className="text-gray-600">Budget alloué : </span>
              <span className={`font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalAllocated}€ / {config.totalCapital}€
              </span>
            </div>
          </div>
          
          {remainingBudget < 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                ⚠️ Le budget alloué dépasse le capital total de {Math.abs(remainingBudget)}€
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  strategy.enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{strategy.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(strategy.riskLevel)}`}>
                        {strategy.riskLevel.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {strategy.targetGain}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{strategy.description}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleStrategy(strategy.id)}
                    className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                      strategy.enabled
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {strategy.enabled ? 'Activée' : 'Désactivée'}
                  </button>
                </div>
                
                {strategy.enabled && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget alloué (€)
                    </label>
                    <input
                      type="number"
                      value={strategy.budget}
                      onChange={(e) => updateStrategyBudget(strategy.id, Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={config.totalCapital}
                      step="5"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              {saveMessage && (
                <p className={`text-sm font-medium ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || remainingBudget < 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
