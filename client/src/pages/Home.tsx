import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, Bell, RefreshCw, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { NotificationButton } from "@/components/NotificationButton";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";
import { TradingPanel } from "@/components/TradingPanel";
import { NewsletterForm } from "@/components/NewsletterForm";
import { BookOpen, Check, Star } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Récupération des prix en temps réel
  const { data: marketPrices } = trpc.market.prices.useQuery(undefined, {
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
  
  // Récupération des alertes
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery(undefined, {
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Filtrage des alertes par actif si nécessaire
  const { data: filteredAlerts } = trpc.alerts.byAsset.useQuery(
    { asset: selectedAsset! },
    { enabled: !!selectedAsset }
  );

  // Mutation pour générer de nouvelles alertes
  const generateAlerts = trpc.alerts.generate.useMutation({
    onSuccess: () => {
      toast.success("Nouvelles alertes générées avec succès");
      refetch();
    },
    onError: () => {
      toast.error("Erreur lors de la génération des alertes");
    },
  });

  const displayedAlerts = selectedAsset ? filteredAlerts : alerts;

  // Hook de notifications pour les nouvelles alertes
  useAlertNotifications(alerts);

  // Statistiques
  const stats = {
    total: alerts?.length || 0,
    btc: alerts?.filter(a => a.asset === 'BTC-USD').length || 0,
    eth: alerts?.filter(a => a.asset === 'ETH-USD').length || 0,
    pepe: alerts?.filter(a => a.asset === 'PEPE-USD').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="CryptoBot Pro - Le Bot de Trading IA Automatique"
        description="Automatisez vos gains crypto 24/7. Notre bot utilise l'IA et l'analyse de sentiment pour trader Bitcoin et Ethereum à votre place. Essai gratuit."
      />
      {/* Hero Section Marketing */}
      <section className="relative py-20 overflow-hidden border-b border-border bg-gradient-to-b from-background to-background/50">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Star className="mr-1 h-3.5 w-3.5 fill-primary" /> Nouveau : Algorithme IA V2.0 Disponible
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-white animate-in fade-in slide-in-from-bottom-6 duration-700">
            Automatisez vos Gains Crypto<br />
            <span className="text-primary">Sans Y Passer Vos Nuits</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Le bot de trading qui surveille le marché 24/7 pour vous. 
            Rejoignez l'élite des traders qui utilisent l'IA pour sécuriser leurs profits.
          </p>

          <div className="mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <NewsletterForm />
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Installation en 2 min
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Pas de carte requise
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Sécurisé par Coinbase
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnet Teaser */}
      <section className="py-12 bg-card/50 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-primary/10">
            <div className="flex-shrink-0 bg-primary/20 p-4 rounded-xl">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Cadeau de Bienvenue : Le Guide Ultime 2025 🎁</h3>
              <p className="text-muted-foreground">
                Inscrivez-vous ci-dessus et recevez immédiatement notre PDF exclusif : 
                <span className="font-semibold text-foreground"> "Les 5 Stratégies Secrètes des Baleines Crypto"</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Header Dashboard (Ancien Header) */}
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-lg bg-card/80">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
                <span className="hidden xs:inline">Crypto Alert Dashboard</span>
                <span className="xs:hidden">Crypto Alerts</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Système de veille 24/7 pour détecter les opportunités de trading
              </p>
            </div>
            <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
              <NotificationButton />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/performance')}
                className="flex-1 sm:flex-initial"
              >
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Performance</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <Button
                size="sm"
                onClick={() => generateAlerts.mutate()}
                disabled={generateAlerts.isPending}
                className="flex-1 sm:flex-initial"
              >
                <Bell className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Générer Alertes</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'BTC-USD' ? null : 'BTC-USD')}>
            <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>BTC</span>
                {selectedAsset === 'BTC-USD' && <Badge variant="default" className="text-xs px-1">✓</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.btc}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'ETH-USD' ? null : 'ETH-USD')}>
            <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>ETH</span>
                {selectedAsset === 'ETH-USD' && <Badge variant="default" className="text-xs px-1">✓</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.eth}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'PEPE-USD' ? null : 'PEPE-USD')}>
            <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>PEPE</span>
                {selectedAsset === 'PEPE-USD' && <Badge variant="default" className="text-xs px-1">✓</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.pepe}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2 flex-wrap">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Alertes</span>
              {selectedAsset && (
                <Badge variant="secondary" className="text-xs">
                  {selectedAsset}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Opportunités détectées par le système d'analyse technique
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !displayedAlerts || displayedAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune alerte disponible</p>
                <p className="text-sm mt-2">Cliquez sur "Générer Alertes" pour créer de nouvelles opportunités</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {displayedAlerts.map((alert) => (
                  <Card key={alert.id} className="bg-secondary border-border hover:border-primary transition-colors">
                    <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <Badge variant="default" className="text-xs sm:text-sm font-semibold">
                              {alert.asset}
                            </Badge>
                            <span className="text-lg sm:text-2xl font-bold text-foreground">
                              ${alert.price}
                            </span>
                            <Badge
                              variant={alert.confidence === 'Très Élevée' ? 'default' : 'secondary'}
                              className="ml-auto text-xs"
                            >
                              {alert.confidence}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                            <span className="text-xs sm:text-sm font-medium text-accent">
                              {alert.recommendation}
                            </span>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Indicateurs:</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {alert.indicatorsTriggered.map((indicator: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 sm:mt-4 text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        {/* Trading Panel */}
                        <div className="ml-0 sm:ml-4 mt-3 sm:mt-0 w-full sm:w-80">
                          <TradingPanel
                            symbol={alert.asset}
                            currentPrice={parseFloat(alert.price)}
                            signalType={alert.recommendation.toLowerCase().includes('achat') || alert.recommendation.toLowerCase().includes('buy') ? 'buy' : 'sell'}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
