import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
  signalType: "buy" | "sell";
}

export function TradingPanel({ symbol, currentPrice, signalType }: TradingPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paperTrading, setPaperTrading] = useState(true);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());

  // Récupérer les soldes du compte (réel ou Paper Trading)
  const { data: balances, isLoading: balancesLoading } = trpc.trading.balances.useQuery(undefined, {
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
    enabled: !paperTrading,
  });

  // Récupérer le portefeuille Paper Trading
  const { data: paperPortfolio, refetch: refetchPaperPortfolio } = trpc.paperTrading.portfolio.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: paperTrading,
  });

  // Mutation pour placer un ordre
  const placeOrder = trpc.trading.placeOrder.useMutation({
    onSuccess: (result) => {
      if (result.status === "completed") {
        toast.success(
          paperTrading
            ? `Ordre simulé exécuté avec succès (Paper Trading)`
            : `Ordre exécuté avec succès`,
          {
            description: `${signalType.toUpperCase()} ${amount} ${symbol} @ ${result.price}`,
          }
        );
        // Rafraîchir le portefeuille Paper Trading
        if (paperTrading) {
          refetchPaperPortfolio();
        }
      } else if (result.status === "failed") {
        toast.error("Échec de l'ordre", {
          description: result.message || "Une erreur est survenue",
        });
      }
      setIsDialogOpen(false);
      setAmount("");
    },
    onError: (error) => {
      toast.error("Erreur lors du placement de l'ordre", {
        description: error.message,
      });
    },
  });

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmOrder = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Montant invalide", {
        description: "Veuillez entrer un montant valide",
      });
      return;
    }

    placeOrder.mutate({
      symbol,
      side: signalType,
      amount: amountNum,
      price: orderType === "limit" ? parseFloat(limitPrice) : undefined,
      type: orderType,
      paperTrading,
    });
  };

  const handleCalculateMaxBuy = () => {
    const eurBalance = balances?.find((b) => b.currency === "EUR");
    if (eurBalance && currentPrice > 0) {
      const maxAmount = parseFloat(eurBalance.available) / currentPrice;
      setAmount(maxAmount.toFixed(8));
    }
  };

  // Utiliser le solde approprié selon le mode
  const eurBalance = paperTrading
    ? { currency: "EUR", available: paperPortfolio?.cash.toString() || "0" }
    : balances?.find((b) => b.currency === "EUR");
  const availableBalance = eurBalance ? parseFloat(eurBalance.available) : 0;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            Trading
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {paperTrading ? (
              <Badge variant="outline" className="text-xs">
                Mode Paper Trading
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Mode Trading Réel
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Soldes */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">
              {paperTrading ? "Portefeuille Paper Trading" : "Soldes disponibles"}
            </Label>
            {(balancesLoading && !paperTrading) ? (
              <div className="text-xs sm:text-sm text-muted-foreground">Chargement...</div>
            ) : paperTrading ? (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                  <div className="text-xs text-muted-foreground">Cash disponible</div>
                  <div className="text-sm sm:text-base font-semibold">
                    {paperPortfolio?.cash.toFixed(2) || "0.00"} EUR
                  </div>
                </div>
                {paperPortfolio && Object.keys(paperPortfolio.positions).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Positions ouvertes</div>
                    {Object.entries(paperPortfolio.positions).map(([sym, pos]) => (
                      <div key={sym} className="bg-muted/30 rounded p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{sym}</span>
                          <span>{pos.quantity.toFixed(8)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Prix moyen: {pos.avgPrice.toFixed(8)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {balances?.map((balance) => (
                  <div
                    key={balance.currency}
                    className="bg-muted/50 rounded-lg p-2 sm:p-3"
                  >
                    <div className="text-xs text-muted-foreground">{balance.currency}</div>
                    <div className="text-sm sm:text-base font-semibold">
                      {parseFloat(balance.available).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bouton de trading */}
          <Button
            onClick={handleOpenDialog}
            className="w-full"
            variant={signalType === "buy" ? "default" : "destructive"}
            disabled={placeOrder.isPending}
          >
            {signalType === "buy" ? (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Acheter {symbol}
              </>
            ) : (
              <>
                <TrendingDown className="mr-2 h-4 w-4" />
                Vendre {symbol}
              </>
            )}
          </Button>

          {/* Switch Paper Trading */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="paper-trading" className="text-xs sm:text-sm">
              Paper Trading
            </Label>
            <Switch
              id="paper-trading"
              checked={paperTrading}
              onCheckedChange={setPaperTrading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirmer l'ordre {signalType === "buy" ? "d'achat" : "de vente"}
            </DialogTitle>
            <DialogDescription>
              {paperTrading ? (
                <span className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Mode Paper Trading - Aucun ordre réel ne sera exécuté
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Mode Trading Réel - L'ordre sera exécuté sur Coinbase
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type d'ordre */}
            <div className="space-y-2">
              <Label>Type d'ordre</Label>
              <div className="flex gap-2">
                <Button
                  variant={orderType === "market" ? "default" : "outline"}
                  onClick={() => setOrderType("market")}
                  className="flex-1"
                  size="sm"
                >
                  Marché
                </Button>
                <Button
                  variant={orderType === "limit" ? "default" : "outline"}
                  onClick={() => setOrderType("limit")}
                  className="flex-1"
                  size="sm"
                >
                  Limite
                </Button>
              </div>
            </div>

            {/* Prix limite (si ordre limite) */}
            {orderType === "limit" && (
              <div className="space-y-2">
                <Label htmlFor="limit-price">Prix limite</Label>
                <Input
                  id="limit-price"
                  type="number"
                  step="0.00000001"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Prix limite"
                />
              </div>
            )}

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Montant ({symbol.split("-")[0]})
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                />
                {signalType === "buy" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateMaxBuy}
                  >
                    Max
                  </Button>
                )}
              </div>
            </div>

            {/* Résumé */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix actuel</span>
                <span className="font-semibold">{currentPrice.toFixed(8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-semibold">{amount || "0.00"}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Total estimé</span>
                <span className="font-semibold">
                  {(parseFloat(amount || "0") * currentPrice).toFixed(2)} EUR
                </span>
              </div>
              {signalType === "buy" && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Solde disponible</span>
                  <span>{availableBalance.toFixed(2)} EUR</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={placeOrder.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmOrder}
              disabled={placeOrder.isPending}
              variant={signalType === "buy" ? "default" : "destructive"}
            >
              {placeOrder.isPending ? (
                "Traitement..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
