# Problème avec les clés API Coinbase CDP

## Résumé du problème

Les clés API générées sur **cloud.coinbase.com** (CDP - Coinbase Developer Platform) utilisent un format différent des anciennes clés API de **coinbase.com/settings/api**.

### Format des clés CDP

Lorsque vous créez une clé API sur CDP, vous obtenez un fichier JSON avec :
- `name` : L'ID de la clé API (ex: `organizations/.../apiKeys/...`)
- `privateKey` : La clé privée au format PEM EC
- `publicKey` : La clé publique (non utilisée pour l'authentification)

### Problème actuel

Notre variable d'environnement `COINBASE_API_SECRET` contient une clé **base64 brute**, pas une clé EC au format PEM. Cela cause l'erreur :
```
secretOrPrivateKey must be an asymmetric key when using ES256
```

## Solutions possibles

### Option 1 : Utiliser le SDK Python Coinbase (recommandé)

Le SDK Python officiel de Coinbase gère automatiquement la génération de JWT :

```python
from coinbase import jwt_generator

api_key = "organizations/{org_id}/apiKeys/{key_id}"
api_secret = "-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----\n"

request_method = "GET"
request_path = "/api/v3/brokerage/accounts"

jwt_uri = jwt_generator.format_jwt_uri(request_method, request_path)
jwt_token = jwt_generator.build_rest_jwt(jwt_uri, api_key, api_secret)
```

### Option 2 : Utiliser un package Node.js spécialisé

Il existe des packages Node.js qui gèrent l'authentification Coinbase CDP :
- `coinbase-advanced-node` : https://github.com/JoshJancula/coinbase-advanced-node
- `coinbase-api` (npm) : Package mis à jour pour gérer les nouvelles clés

### Option 3 : Régénérer les clés API au bon format

1. Se connecter sur https://cloud.coinbase.com
2. Créer une nouvelle clé API avec :
   - Type : **ECDSA** (ES256)
   - Permissions : Read + Trade
3. Télécharger le fichier JSON
4. Extraire `name` et `privateKey` du JSON
5. Configurer les variables d'environnement :
   ```bash
   COINBASE_API_KEY_ID="organizations/.../apiKeys/..."
   COINBASE_API_SECRET="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----\n"
   ```

## Recommandation

Pour notre projet, je recommande **l'Option 2** : utiliser le package `coinbase-advanced-node` qui est spécialement conçu pour gérer les nouvelles clés CDP et l'authentification JWT.

Avantages :
- Gère automatiquement la génération de JWT
- Supporte TypeScript
- Maintenu activement
- Documentation claire

## Prochaines étapes

1. Installer `coinbase-advanced-node`
2. Remplacer notre client custom par ce package
3. Tester avec vos clés API existantes
4. Si ça ne fonctionne pas, régénérer les clés au format correct
