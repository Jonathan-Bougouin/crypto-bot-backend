import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, Bell, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                Crypto Alert Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Système de veille 24/7 pour détecter les opportunités de trading
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                size="sm"
                onClick={() => generateAlerts.mutate()}
                disabled={generateAlerts.isPending}
              >
                <Bell className="h-4 w-4 mr-2" />
                Générer Alertes
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'BTC-USD' ? null : 'BTC-USD')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                BTC-USD
                {selectedAsset === 'BTC-USD' && <Badge variant="default">Actif</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.btc}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'ETH-USD' ? null : 'ETH-USD')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                ETH-USD
                {selectedAsset === 'ETH-USD' && <Badge variant="default">Actif</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.eth}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedAsset(selectedAsset === 'PEPE-USD' ? null : 'PEPE-USD')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                PEPE-USD
                {selectedAsset === 'PEPE-USD' && <Badge variant="default">Actif</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.pepe}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes de Trading
              {selectedAsset && (
                <Badge variant="secondary" className="ml-2">
                  Filtre: {selectedAsset}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
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
              <div className="space-y-4">
                {displayedAlerts.map((alert) => (
                  <Card key={alert.id} className="bg-secondary border-border hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="default" className="text-sm font-semibold">
                              {alert.asset}
                            </Badge>
                            <span className="text-2xl font-bold text-foreground">
                              ${alert.price}
                            </span>
                            <Badge
                              variant={alert.confidence === 'Très Élevée' ? 'default' : 'secondary'}
                              className="ml-auto"
                            >
                              {alert.confidence}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium text-accent">
                              {alert.recommendation}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Indicateurs Déclenchés:</p>
                            <div className="flex flex-wrap gap-2">
                              {alert.indicatorsTriggered.map((indicator: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 text-xs text-muted-foreground">
                            Détecté le: {new Date(alert.timestamp).toLocaleString('fr-FR')}
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
