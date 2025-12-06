# Notes sur le SDK Coinbase Node.js

## Informations importantes

Le SDK Coinbase Node.js (`@coinbase/coinbase-sdk`) est principalement conçu pour :
- Gérer des **wallets on-chain** (portefeuilles crypto sur la blockchain)
- Effectuer des **transferts** entre wallets
- Faire du **trading** entre actifs (ex: ETH → USDC)

**IMPORTANT** : Ce SDK n'est PAS conçu pour l'API Advanced Trade de Coinbase qui permet de trader sur la plateforme Coinbase Exchange.

## Différence entre les APIs Coinbase

### 1. Coinbase SDK (ce que nous avons installé)
- **Usage** : Gestion de wallets on-chain, transferts, swaps
- **Package** : `@coinbase/coinbase-sdk`
- **Cas d'usage** : Applications qui ont besoin de créer des wallets, envoyer/recevoir des cryptos
- **Limitation** : Ne permet PAS de trader sur Coinbase Exchange

### 2. Coinbase Advanced Trade API
- **Usage** : Trading sur la plateforme Coinbase (ordres d'achat/vente)
- **Package** : Utilise des appels REST API directs ou des SDK tiers
- **Cas d'usage** : Bots de trading, applications de trading automatisé
- **Ce dont nous avons besoin** : Récupérer soldes, placer ordres, obtenir prix

## Solution pour notre projet

Pour implémenter le trading réel sur Coinbase, nous devons utiliser l'**Advanced Trade REST API** directement, pas le SDK.

### Endpoints nécessaires

1. **Get Account Balances**
   - Endpoint : `GET /api/v3/brokerage/accounts`
   - Documentation : https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getaccounts

2. **Get Product Price**
   - Endpoint : `GET /api/v3/brokerage/products/{product_id}`
   - Documentation : https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getproduct

3. **Place Order**
   - Endpoint : `POST /api/v3/brokerage/orders`
   - Documentation : https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_postorder

### Authentication

L'Advanced Trade API utilise **Cloud API Keys** (ce que nous avons) avec :
- `API Key ID` (déjà configuré)
- `API Secret` (déjà configuré)

L'authentification se fait via JWT (JSON Web Token) signé avec la clé privée.

## Plan d'implémentation

1. Créer un client HTTP pour l'Advanced Trade API
2. Implémenter la génération de JWT pour l'authentification
3. Créer des méthodes pour :
   - `getAccounts()` : Récupérer les soldes
   - `getProductPrice(productId)` : Obtenir le prix d'un produit
   - `placeOrder(params)` : Placer un ordre

4. Remplacer les fonctions simulées dans `coinbaseService.ts` par les vraies implémentations

## Références

- Advanced Trade API Overview : https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/overview
- REST API Reference : https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/introduction
- Authentication Guide : https://docs.cdp.coinbase.com/coinbase-app/docs/authentication
