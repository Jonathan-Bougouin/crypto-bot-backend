import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Performance() {
  const [, setLocation] = useLocation();
  const { data: trades, isLoading } = trpc.trades.closed.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des performances...</p>
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">📊 Historique de Performance</h1>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">Aucun trade enregistré pour le moment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculer les statistiques globales
  const initialCapital = 50;
  let currentCapital = initialCapital;
  
  // Trier les trades par date d'entrée
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  // Calculer l'évolution du capital
  const capitalEvolution = sortedTrades.map((trade, index) => {
    const profit = parseFloat(trade.profit || "0");
    currentCapital += profit;
    return {
      date: new Date(trade.exitTime!).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      capital: parseFloat(currentCapital.toFixed(2)),
      trade: index + 1
    };
  });

  // Statistiques par crypto
  const assetStats = sortedTrades.reduce((acc, trade) => {
    if (!acc[trade.asset]) {
      acc[trade.asset] = { wins: 0, losses: 0, totalProfit: 0 };
    }
    const profit = parseFloat(trade.profit || "0");
    if (profit > 0) {
      acc[trade.asset].wins++;
    } else {
      acc[trade.asset].losses++;
    }
    acc[trade.asset].totalProfit += profit;
    return acc;
  }, {} as Record<string, { wins: number; losses: number; totalProfit: number }>);

  const assetChartData = Object.entries(assetStats).map(([asset, stats]) => ({
    asset: asset.replace('-USD', ''),
    wins: stats.wins,
    losses: stats.losses,
    profit: parseFloat(stats.totalProfit.toFixed(2))
  }));

  // Calculer les statistiques globales
  const totalTrades = sortedTrades.length;
  const winningTrades = sortedTrades.filter(t => parseFloat(t.profit || "0") > 0).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = (winningTrades / totalTrades * 100).toFixed(1);
  const totalProfit = sortedTrades.reduce((sum, t) => sum + parseFloat(t.profit || "0"), 0);
  const roi = ((currentCapital - initialCapital) / initialCapital * 100).toFixed(2);
  const avgProfit = (totalProfit / totalTrades).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux Alertes
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">📊 Historique de Performance</h1>
          <p className="text-gray-400 text-sm md:text-base">Analyse détaillée de vos performances de trading</p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-green-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Capital Final
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-xl md:text-3xl font-bold text-green-400">{currentCapital.toFixed(2)}€</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Initial: {initialCapital}€</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-xl md:text-3xl font-bold text-blue-400">+{roi}%</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Profit: {totalProfit.toFixed(2)}€</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/50">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-purple-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Taux Réussite
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-xl md:text-3xl font-bold text-purple-400">{winRate}%</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">{winningTrades}W / {losingTrades}L</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-700/50">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-orange-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Gain Moyen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-xl md:text-3xl font-bold text-orange-400">{avgProfit}€</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">{totalTrades} trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphique d'évolution du capital */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6 md:mb-8">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">📈 Évolution du Capital</CardTitle>
            <CardDescription className="text-xs md:text-sm">Progression de votre portefeuille au fil des trades</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
              <LineChart data={capitalEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="capital" stroke="#10B981" strokeWidth={2} name="Capital (€)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance par crypto */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6 md:mb-8">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">💰 Performance par Crypto</CardTitle>
            <CardDescription className="text-xs md:text-sm">Comparaison des gains et pertes par actif</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
              <BarChart data={assetChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="asset" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="wins" fill="#10B981" name="Gagnants" />
                <Bar dataKey="losses" fill="#EF4444" name="Perdants" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tableau des derniers trades */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">📋 Derniers Trades</CardTitle>
            <CardDescription className="text-xs md:text-sm">Historique détaillé des 10 derniers trades</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 md:p-3 text-gray-400">Date</th>
                    <th className="text-left p-2 md:p-3 text-gray-400">Actif</th>
                    <th className="text-right p-2 md:p-3 text-gray-400">Entrée</th>
                    <th className="text-right p-2 md:p-3 text-gray-400">Sortie</th>
                    <th className="text-right p-2 md:p-3 text-gray-400">Profit</th>
                    <th className="text-right p-2 md:p-3 text-gray-400">%</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrades.slice(-10).reverse().map((trade) => {
                    const profit = parseFloat(trade.profit || "0");
                    const profitPercent = parseFloat(trade.profitPercent || "0");
                    const isWin = profit > 0;
                    
                    return (
                      <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="p-2 md:p-3 text-gray-300">
                          {new Date(trade.exitTime!).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="p-2 md:p-3">
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                            {trade.asset.replace('-USD', '')}
                          </span>
                        </td>
                        <td className="p-2 md:p-3 text-right text-gray-400 text-xs md:text-sm">
                          {parseFloat(trade.entryPrice).toFixed(2)}$
                        </td>
                        <td className="p-2 md:p-3 text-right text-gray-400 text-xs md:text-sm">
                          {parseFloat(trade.exitPrice!).toFixed(2)}$
                        </td>
                        <td className={`p-2 md:p-3 text-right font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                          {isWin ? '+' : ''}{profit.toFixed(2)}€
                        </td>
                        <td className={`p-2 md:p-3 text-right font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                          {isWin ? '+' : ''}{profitPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
