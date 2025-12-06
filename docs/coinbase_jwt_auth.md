# Authentification JWT pour Coinbase Advanced Trade API

## Informations clés

### Type de clé API requis
- **IMPORTANT** : Les clés Ed25519 (EdDSA) ne sont PAS supportées par les SDK Coinbase App
- **REQUIS** : Utiliser le format ES256 (ECDSA avec courbe P-256)
- Lors de la création de la clé API, sélectionner **ECDSA** comme algorithme de signature

### Format des identifiants
- **API Key Name** : `organizations/{org_id}/apiKeys/{key_id}`
- **API Secret** : Clé privée EC au format PEM
  ```
  -----BEGIN EC PRIVATE KEY-----
  YOUR PRIVATE KEY
  -----END EC PRIVATE KEY-----
  ```

## Processus d'authentification

### 1. Génération du JWT
Chaque requête API nécessite un JWT unique qui :
- Expire après 2 minutes
- Doit être généré pour chaque requête unique
- Utilise l'algorithme ES256 (ECDSA)

### 2. Structure de la requête
```
Authorization: Bearer {JWT_TOKEN}
```

### 3. Exemple avec le SDK Python Coinbase
```python
from coinbase import jwt_generator

api_key = "organizations/{org_id}/apiKeys/{key_id}"
api_secret = "-----BEGIN EC PRIVATE KEY-----\nYOUR PRIVATE KEY\n-----END EC PRIVATE KEY-----\n"

request_method = "GET"
request_path = "/api/v3/brokerage/accounts"

jwt_uri = jwt_generator.format_jwt_uri(request_method, request_path)
jwt_token = jwt_generator.build_rest_jwt(jwt_uri, api_key, api_secret)
```

## Implémentation en Node.js/TypeScript

### Dépendances nécessaires
```bash
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

### Fonction de génération JWT
```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface JWTOptions {
  apiKey: string;      // organizations/{org_id}/apiKeys/{key_id}
  apiSecret: string;   // Private key PEM
  requestMethod: string;
  requestPath: string;
}

function generateJWT(options: JWTOptions): string {
  const { apiKey, apiSecret, requestMethod, requestPath } = options;
  
  // Create JWT URI
  const uri = `${requestMethod} ${process.env.COINBASE_API_HOST || 'api.coinbase.com'}${requestPath}`;
  
  // JWT payload
  const payload = {
    iss: 'coinbase-cloud',
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
    sub: apiKey,
    uri: uri
  };
  
  // Sign JWT with ES256 algorithm
  const token = jwt.sign(payload, apiSecret, {
    algorithm: 'ES256',
    header: {
      kid: apiKey,
      nonce: crypto.randomBytes(16).toString('hex')
    }
  });
  
  return token;
}
```

### Utilisation
```typescript
const token = generateJWT({
  apiKey: process.env.COINBASE_API_KEY_ID!,
  apiSecret: process.env.COINBASE_API_SECRET!,
  requestMethod: 'GET',
  requestPath: '/api/v3/brokerage/accounts'
});

// Faire la requête
const response = await fetch('https://api.coinbase.com/api/v3/brokerage/accounts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Endpoints Advanced Trade API

### Base URL
```
https://api.coinbase.com
```

### Endpoints principaux

#### 1. Get Accounts (Soldes)
```
GET /api/v3/brokerage/accounts
```
Retourne tous les comptes et leurs soldes.

#### 2. Get Product (Prix)
```
GET /api/v3/brokerage/products/{product_id}
```
Exemple : `/api/v3/brokerage/products/BTC-USD`

#### 3. Place Order (Placer un ordre)
```
POST /api/v3/brokerage/orders
```
Body :
```json
{
  "client_order_id": "unique-id",
  "product_id": "BTC-USD",
  "side": "BUY",
  "order_configuration": {
    "market_market_ioc": {
      "quote_size": "10"
    }
  }
}
```

## Sécurité

### Bonnes pratiques
1. Stocker les identifiants dans des variables d'environnement
2. Ne jamais committer les clés API dans le code
3. Utiliser l'IP allowlist pour restreindre l'accès
4. Valider les certificats SSL
5. Régénérer les clés si compromises

### Variables d'environnement
```bash
COINBASE_API_KEY_ID=organizations/xxx/apiKeys/xxx
COINBASE_API_SECRET=-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----\n
```

## Références
- Documentation officielle : https://docs.cdp.coinbase.com/coinbase-app/authentication-authorization/api-key-authentication
- API Reference : https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/introduction
- Python SDK : https://github.com/coinbase/coinbase-advanced-py
