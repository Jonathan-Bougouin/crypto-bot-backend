# Documentation API Polygon (Massive) pour Crypto

## Informations Générales

- **Nom**: Polygon.io (maintenant Massive.com)
- **URL de base**: `https://api.massive.com`
- **Authentification**: Clé API déjà configurée via Manus Data API
- **Accès**: Via le client Data API de Manus
- **Couverture**: Données de marché crypto 24/7 depuis novembre 2013

## Avantages par rapport à CoinGecko

✅ **Données en temps réel** (pas de délai de 30 secondes)
✅ **Historique complet** depuis 2013
✅ **Données OHLC détaillées** avec volume et VWAP
✅ **Pas de gestion de clé API** (déjà configuré)
✅ **Fiabilité professionnelle** pour le trading

## Endpoints Disponibles

### 1. Daily Market Summary - Résumé du Marché Quotidien

**Endpoint**: `GET /v2/aggs/grouped/locale/global/market/crypto/{date}`

**Description**: Récupère les données OHLC (Open, High, Low, Close), volume et VWAP pour TOUS les tickers crypto pour une date donnée.

**Paramètres**:
- `date` (string, required): Date au format YYYY-MM-DD (ex: "2023-01-09")
- `adjusted` (boolean, optional): Ajusté pour les splits (défaut: true)

**Exemple de réponse**:
```json
{
  "adjusted": true,
  "queryCount": 3,
  "results": [
    {
      "T": "X:BTCUSD",
      "c": 67187.34,
      "h": 67500.00,
      "l": 66800.00,
      "n": 18388,
      "o": 67000.00,
      "t": 1580676480000,
      "v": 1234567.89,
      "vw": 67150.00
    }
  ],
  "resultsCount": 1,
  "status": "OK"
}
```

**Structure de la réponse**:
- `T`: Symbole du ticker (ex: "X:BTCUSD", "X:ETHUSD")
- `c`: Prix de clôture
- `h`: Prix le plus haut
- `l`: Prix le plus bas
- `o`: Prix d'ouverture
- `t`: Timestamp Unix (millisecondes)
- `v`: Volume de trading
- `vw`: Prix moyen pondéré par le volume (VWAP)
- `n`: Nombre de transactions

### 2. Snapshots - Données en Temps Réel

**Endpoint**: `GET /v2/snapshot/locale/global/markets/crypto/tickers`

**Description**: Récupère un snapshot en temps réel de tous les tickers crypto.

**Cas d'usage**: Surveillance en temps réel, alertes de trading, analyse de marché.

## Mapping des Symboles

| Symbole Trading | Polygon Ticker | Nom Complet |
|-----------------|----------------|-------------|
| BTC-USD         | X:BTCUSD       | Bitcoin     |
| ETH-USD         | X:ETHUSD       | Ethereum    |
| PEPE-USD        | X:PEPEUSD      | Pepe        |

**Note**: Les tickers crypto sur Polygon utilisent le préfixe "X:" suivi du symbole de la crypto et de la devise (ex: X:BTCUSD).

## Utilisation via Manus Data API

### Python (Runtime Agent)

```python
import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

client = ApiClient()

# Récupérer le résumé du marché quotidien
result = client.call_api(
    'Polygon/get_daily_market_summary_crypto',
    query={'date': '2025-11-29'}
)
```

### TypeScript (Application Web)

```typescript
import { callDataApi } from "@/server/_core/dataApi";

// Récupérer le résumé du marché quotidien
const result = await callDataApi("Polygon/get_daily_market_summary_crypto", {
  query: { date: '2025-11-29' }
});
```

## Limites et Bonnes Pratiques

1. **Rate Limiting**: 
   - Dépend du plan (généralement très généreux pour les plans payants)
   - Pas de limite stricte documentée pour l'API gratuite

2. **Fréquence de mise à jour**:
   - Données en temps réel disponibles
   - Recommandation: Rafraîchir toutes les 10-30 secondes pour les alertes

3. **Historique**:
   - Données disponibles depuis novembre 2013
   - Idéal pour le backtesting et l'analyse historique

4. **Timezone**:
   - Toutes les données sont en UTC
   - Timestamps en millisecondes Unix

## Avantages pour le Trading

1. **Données de haute qualité**: Agrégées depuis Coinbase, Bitfinex, Bitstamp, Kraken
2. **Latence minimale**: Connexions directes aux exchanges
3. **Fiabilité**: Infrastructure professionnelle pour le trading
4. **Couverture 24/7**: Marché crypto ouvert en continu
5. **VWAP inclus**: Indicateur important pour l'analyse technique
