import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Power, 
  AlertCircle,
  Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Dashboard() {
  // Récupération des données réelles
  const { data: summary, isLoading: isLoadingSummary } = trpc.dashboard.getSummary.useQuery();
  const { data: activePositions, isLoading: isLoadingPositions } = trpc.dashboard.getActivePositions.useQuery();
  const { data: performanceHistory } = trpc.dashboard.getPerformanceHistory.useQuery();

  if (isLoadingSummary || isLoadingPositions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre portefeuille et de l'activité du bot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={summary?.botStatus === 'active' ? "default" : "destructive"} className="text-sm py-1 px-3">
            {summary?.botStatus === 'active' ? (
              <><Activity className="w-4 h-4 mr-2 animate-pulse" /> Bot Actif</>
            ) : (
              <><Power className="w-4 h-4 mr-2" /> Bot Inactif</>
            )}
          </Badge>
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Historique
          </Button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Total Estimé</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.balance ? `$${summary.balance.toFixed(2)}` : "---"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.currencyBalances?.map((b: any) => `${b.balance.toFixed(2)} ${b.currency}`).join(' + ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Total (PnL)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.totalProfit && summary.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary?.totalProfit ? (summary.totalProfit >= 0 ? '+' : '') + `$${summary.totalProfit.toFixed(2)}` : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.winRate ? `${summary.winRate.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur les trades fermés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions Actives</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activePositionsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En cours de surveillance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique et Positions */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Graphique de Performance */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance du Portefeuille</CardTitle>
            <CardDescription>Évolution de votre PnL sur les 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {performanceHistory && performanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceHistory}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: fr })}
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                      labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-50" />
                  <p>Pas assez de données pour afficher le graphique</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Positions Actives */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Positions Actives</CardTitle>
            <CardDescription>Trades en cours gérés par le bot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePositions && activePositions.length > 0 ? (
                activePositions.map((pos: any) => (
                  <div key={pos.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${pos.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {pos.side === 'buy' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{pos.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          Entrée: ${parseFloat(pos.entryPrice).toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${parseFloat(pos.profitLossPercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(pos.profitLossPercent) >= 0 ? '+' : ''}{parseFloat(pos.profitLossPercent).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${parseFloat(pos.currentValue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>Aucune position active</p>
                  <p className="text-xs mt-1">Le bot scanne le marché...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
