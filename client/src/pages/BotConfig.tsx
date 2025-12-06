import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bot, 
  Zap, 
  Shield, 
  Activity, 
  Save, 
  Play, 
  Square, 
  AlertTriangle,
  BrainCircuit
} from "lucide-react";

export default function BotConfig() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.botConfig.getConfig.useQuery();
  const updateConfigMutation = trpc.botConfig.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration sauvegardée avec succès");
      utils.botConfig.getConfig.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
  
  const toggleBotMutation = trpc.botConfig.toggleBot.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === 'active' ? "Bot démarré !" : "Bot arrêté.");
      utils.botConfig.getConfig.invalidate();
      utils.dashboard.getSummary.invalidate();
    },
    onError: (error) => {
      toast.error(`Impossible de changer l'état du bot: ${error.message}`);
    }
  });

  // État local pour le formulaire
  const [formData, setFormData] = useState({
    autoTrade: false,
    paperTrading: true,
    riskPerTrade: 2,
    maxOpenPositions: 3,
    strategies: {
      scalping: false,
      swing: true,
      sentiment: true
    },
    assets: ['BTC', 'ETH', 'SOL']
  });

  // Synchroniser l'état local avec les données du serveur
  useEffect(() => {
    if (config) {
      setFormData({
        autoTrade: config.autoTrade || false,
        paperTrading: config.paperTrading ?? true,
        riskPerTrade: parseFloat(config.riskPerTrade as string) || 2,
        maxOpenPositions: config.maxOpenPositions || 3,
        strategies: config.strategies as any || { scalping: false, swing: true, sentiment: true },
        assets: ['BTC', 'ETH', 'SOL'] // TODO: Ajouter la gestion des assets en DB
      });
    }
  }, [config]);

  const handleSave = () => {
    updateConfigMutation.mutate(formData);
  };

  const handleToggleBot = () => {
    toggleBotMutation.mutate({ isRunning: !config?.isRunning });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" /> Configuration du Bot
          </h1>
          <p className="text-muted-foreground">
            Personnalisez le comportement de votre assistant de trading.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border">
            <Switch 
              id="bot-status" 
              checked={config?.isRunning || false}
              onCheckedChange={handleToggleBot}
              disabled={toggleBotMutation.isPending}
            />
            <Label htmlFor="bot-status" className={`font-bold ${config?.isRunning ? 'text-green-500' : 'text-muted-foreground'}`}>
              {config?.isRunning ? 'BOT ACTIF' : 'BOT INACTIF'}
            </Label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Paramètres Généraux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" /> Mode de Trading
            </CardTitle>
            <CardDescription>Définissez comment le bot interagit avec le marché.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="paper-trading" className="text-base font-medium">Paper Trading (Simulation)</Label>
                <p className="text-sm text-muted-foreground">
                  Tradez avec de l'argent fictif pour tester vos stratégies sans risque.
                </p>
              </div>
              <Switch 
                id="paper-trading" 
                checked={formData.paperTrading}
                onCheckedChange={(checked) => setFormData({...formData, paperTrading: checked})}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="auto-trade" className="text-base font-medium">Trading Automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser le bot à passer des ordres réels sans confirmation manuelle.
                </p>
              </div>
              <Switch 
                id="auto-trade" 
                checked={formData.autoTrade}
                onCheckedChange={(checked) => setFormData({...formData, autoTrade: checked})}
              />
            </div>

            {!formData.paperTrading && formData.autoTrade && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="text-sm text-red-500">
                  <strong>Attention :</strong> Vous êtes sur le point d'activer le trading automatique avec du capital réel. Assurez-vous d'avoir bien testé votre stratégie en Paper Trading d'abord.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestion du Risque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" /> Gestion du Risque
            </CardTitle>
            <CardDescription>Protégez votre capital avec des limites strictes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Risque par Trade</Label>
                <span className="font-bold text-primary">{formData.riskPerTrade}%</span>
              </div>
              <Slider 
                value={[formData.riskPerTrade]} 
                min={0.5} 
                max={10} 
                step={0.5} 
                onValueChange={(val) => setFormData({...formData, riskPerTrade: val[0]})}
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage de votre capital total engagé sur une seule position.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Positions Simultanées Max</Label>
                <span className="font-bold text-primary">{formData.maxOpenPositions}</span>
              </div>
              <Slider 
                value={[formData.maxOpenPositions]} 
                min={1} 
                max={10} 
                step={1} 
                onValueChange={(val) => setFormData({...formData, maxOpenPositions: val[0]})}
              />
              <p className="text-xs text-muted-foreground">
                Nombre maximum de trades ouverts en même temps.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stratégies */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-purple-500" /> Stratégies Actives
            </CardTitle>
            <CardDescription>Sélectionnez les signaux que le bot doit écouter.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3 border p-4 rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="strat-scalping" 
                  checked={formData.strategies.scalping}
                  onCheckedChange={(checked) => setFormData({
                    ...formData, 
                    strategies: { ...formData.strategies, scalping: checked as boolean }
                  })}
                />
                <div className="space-y-1">
                  <Label htmlFor="strat-scalping" className="font-medium cursor-pointer">Scalping Rapide</Label>
                  <p className="text-xs text-muted-foreground">
                    Profite des petits mouvements de prix sur des durées très courtes (1-15 min).
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">Risque Élevé</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 border p-4 rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="strat-swing" 
                  checked={formData.strategies.swing}
                  onCheckedChange={(checked) => setFormData({
                    ...formData, 
                    strategies: { ...formData.strategies, swing: checked as boolean }
                  })}
                />
                <div className="space-y-1">
                  <Label htmlFor="strat-swing" className="font-medium cursor-pointer">Swing Trading</Label>
                  <p className="text-xs text-muted-foreground">
                    Capture les tendances sur plusieurs jours. Plus stable et moins stressant.
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">Recommandé</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 border p-4 rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="strat-sentiment" 
                  checked={formData.strategies.sentiment}
                  onCheckedChange={(checked) => setFormData({
                    ...formData, 
                    strategies: { ...formData.strategies, sentiment: checked as boolean }
                  })}
                />
                <div className="space-y-1">
                  <Label htmlFor="strat-sentiment" className="font-medium cursor-pointer">IA Sentiment Analysis</Label>
                  <p className="text-xs text-muted-foreground">
                    Analyse les news et réseaux sociaux pour filtrer les faux signaux.
                  </p>
                  <Badge className="mt-2 text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">IA Powered</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button size="lg" onClick={handleSave} disabled={updateConfigMutation.isPending}>
              {updateConfigMutation.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Sauvegarde...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Enregistrer la Configuration</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
