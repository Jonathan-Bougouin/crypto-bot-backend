# Documentation API CoinGecko

## Informations Générales

- **URL de base**: `https://api.coingecko.com/api/v3`
- **Authentification**: Pas de clé API requise pour l'API gratuite (Demo)
- **Limite de taux**: 10-50 appels/minute (API gratuite)
- **Format de réponse**: JSON

## Endpoints Utilisés

### 1. Simple Price - Récupération des Prix

**Endpoint**: `GET /simple/price`

**URL complète**: `https://api.coingecko.com/api/v3/simple/price`

**Paramètres**:
- `ids` (string, required): IDs des coins séparés par des virgules
  - Bitcoin: `bitcoin`
  - Ethereum: `ethereum`
  - Pepe: `pepe`
- `vs_currencies` (string, required): Devise cible (ex: `usd`)
- `include_market_cap` (boolean): Inclure la capitalisation boursière
- `include_24hr_vol` (boolean): Inclure le volume 24h
- `include_24hr_change` (boolean): Inclure le changement 24h en %
- `include_last_updated_at` (boolean): Inclure le timestamp de dernière mise à jour

**Exemple de requête**:
```
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,pepe&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true
```

**Exemple de réponse**:
```json
{
  "bitcoin": {
    "usd": 67187.34,
    "usd_market_cap": 1317802988326.25,
    "usd_24h_vol": 31260929299.52,
    "usd_24h_change": 3.64,
    "last_updated_at": 1711356300
  },
  "ethereum": {
    "usd": 3520.00,
    "usd_market_cap": 423000000000,
    "usd_24h_vol": 15000000000,
    "usd_24h_change": 2.5,
    "last_updated_at": 1711356300
  },
  "pepe": {
    "usd": 0.000015,
    "usd_market_cap": 630000000,
    "usd_24h_vol": 50000000,
    "usd_24h_change": -1.2,
    "last_updated_at": 1711356300
  }
}
```

### 2. OHLC Data - Données Chandelier

**Endpoint**: `GET /coins/{id}/ohlc`

**URL complète**: `https://api.coingecko.com/api/v3/coins/{id}/ohlc`

**Paramètres**:
- `id` (string, required): ID du coin (ex: `bitcoin`)
- `vs_currency` (string, required): Devise cible (ex: `usd`)
- `days` (string, required): Nombre de jours de données (1, 7, 14, 30, 90, 180, 365, max)

**Exemple de requête**:
```
GET https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1
```

**Exemple de réponse**:
```json
[
  [1711356000000, 67000, 67500, 66800, 67200],  // [timestamp, open, high, low, close]
  [1711359600000, 67200, 67800, 67100, 67500],
  ...
]
```

## Mapping des Symboles

| Symbole Trading | CoinGecko ID | Nom Complet |
|-----------------|--------------|-------------|
| BTC-USD         | bitcoin      | Bitcoin     |
| ETH-USD         | ethereum     | Ethereum    |
| PEPE-USD        | pepe         | Pepe        |

## Limites et Bonnes Pratiques

1. **Rate Limiting**: 
   - API gratuite: 10-50 appels/minute
   - Implémenter un système de cache pour réduire les appels

2. **Fréquence de mise à jour**:
   - Prix: Toutes les 20 secondes (API Pro) ou 60 secondes (API gratuite)
   - Recommandation: Rafraîchir toutes les 30-60 secondes

3. **Gestion des erreurs**:
   - Code 429: Rate limit dépassé → Attendre avant de réessayer
   - Code 404: Coin non trouvé → Vérifier l'ID du coin
   - Code 500: Erreur serveur → Réessayer après quelques secondes

4. **Cache**:
   - Implémenter un cache local avec TTL de 30 secondes
   - Éviter les appels redondants pour les mêmes données
