import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, Bell, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { NotificationButton } from "@/components/NotificationButton";
import { useAlertNotifications } from "@/hooks/useAlertNotifications";

export default function Home() {
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
      {/* Header */}
      <header className="border-b border-border bg-card">
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
                      <div className="flex items-start justify-between">
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
