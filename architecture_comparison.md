# Comparatif des Architectures de Surveillance pour CryptoBot Pro

## 1. Les Limites Techniques de Coinbase Advanced

Avant de choisir une architecture, il est crucial de comprendre les contraintes imposées par Coinbase [1] [2] :

*   **REST API (Requêtes HTTP)** :
    *   **Public** : 10 requêtes/seconde par IP.
    *   **Privé (Trading)** : 10 à 30 requêtes/seconde selon le profil.
    *   **Global** : 10,000 requêtes/heure par clé API.
*   **WebSocket (Temps Réel)** :
    *   **Connexions** : 750 connexions/seconde par IP (très large).
    *   **Abonnements** : Limite non stricte mais recommandée de ~50 paires par connexion pour éviter la latence.
    *   **Message Rate** : Pas de limite stricte en réception, mais le client doit pouvoir traiter le flux sans lag.

---

## 2. Les 3 Architectures Possibles

### Option A : Le "Scanner Global" (Centralisé)
**Concept :** Le serveur maintient une connexion WebSocket unique qui écoute TOUTES les paires disponibles (ou le Top 100/500). Il analyse le marché en permanence et envoie des signaux aux bots des utilisateurs.

*   **Avantages :**
    *   **Couverture Maximale :** Ne rate aucune opportunité, même sur des "shitcoins" inconnus.
    *   **Efficacité :** Une seule connexion pour 10,000 utilisateurs. Pas de duplication de flux.
    *   **Simplicité Client :** L'utilisateur n'a rien à configurer, le bot chasse tout seul.
*   **Inconvénients :**
    *   **Charge Serveur Extrême :** Traiter 500 flux de prix x 10 updates/seconde demande un serveur très puissant (CPU/RAM).
    *   **Latence :** Le temps de traitement peut augmenter si le marché s'emballe.
    *   **Risque Unique :** Si le scanner plante, plus personne ne trade.

### Option B : La "Watchlist Utilisateur" (Décentralisée)
**Concept :** Chaque bot utilisateur (ou groupe de bots) écoute uniquement les cryptos que l'utilisateur a choisies (ex: ses 10 favorites).

*   **Avantages :**
    *   **Légèreté :** Le serveur ne traite que ce qui intéresse vraiment les clients.
    *   **Personnalisation :** L'utilisateur a le contrôle total ("Je ne veux trader que du BTC et ETH").
    *   **Isolation :** Le crash d'un bot n'impacte pas les autres.
*   **Inconvénients :**
    *   **Opportunités Manquées :** Si le DOGE explose et qu'il n'est pas dans la liste, le bot ne fera rien.
    *   **Redondance :** Si 1000 utilisateurs surveillent BTC, on a 1000 processus qui analysent la même chose (gaspillage).

### Option C : L'Approche Hybride "Smart Tiering" (Recommandée)
**Concept :** On combine le meilleur des deux mondes.
1.  **Tier 1 (Top 20)** : Le serveur surveille en permanence les 20 plus grosses cryptos (BTC, ETH, SOL, etc.) pour tout le monde.
2.  **Tier 2 (Watchlist)** : L'utilisateur peut ajouter jusqu'à 5 cryptos "exotiques" de son choix.
3.  **Tier 3 (Scanner Volatilité)** : Un processus léger scanne le reste du marché uniquement pour détecter les variations brutales (>5% en 5min) et alerte les utilisateurs "Pro".

---

## 3. Recommandation Stratégique

Pour maximiser la performance sans exploser les coûts d'infrastructure, je recommande l'**Option C (Hybride)**.

**Pourquoi ?**
*   90% du volume et des opportunités fiables se font sur le Top 20.
*   Cela permet de garantir une exécution ultra-rapide sur les majeurs.
*   Le module "Scanner Volatilité" ajoute l'effet "Wow" en détectant les pépites sans devoir surveiller chaque tick de prix inutilement.

## 4. Implémentation Technique (V2)

Pour passer de la liste fixe actuelle (3 cryptos) à l'Option C, nous devrons :
1.  Modifier `DataManager` pour accepter une liste dynamique.
2.  Créer un `MarketScannerService` qui tourne en parallèle pour le Tier 3.
3.  Mettre à jour l'interface utilisateur pour permettre la sélection des "Favoris".

---

**Références :**
[1] Coinbase Advanced Trade API Rate Limits - https://docs.cdp.coinbase.com/exchange/rest-api/rate-limits
[2] WebSocket Limits - https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-rate-limits
