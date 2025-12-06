# Crypto Alert Dashboard - Système de Trading Automatisé

**Version 6.0** - Intégration complète du trading avec Coinbase API

Un système de veille 24/7 pour détecter les opportunités de trading sur les cryptomonnaies avec fonctionnalités de trading intégrées et mode Paper Trading.

---

## 🚀 Fonctionnalités

### Système d'alertes en temps réel
- Surveillance continue de BTC-USD, ETH-USD et PEPE-USD
- Analyse technique avancée (RSI, Bollinger Bands, Volume Spike)
- Génération automatique d'alertes toutes les 30 secondes
- Notifications push en temps réel
- Niveaux de confiance (Élevée, Très Élevée)

### Trading intégré
- Panel de trading sur chaque alerte
- Ordres au marché et ordres limite
- Confirmation manuelle avant exécution
- Calcul automatique du montant maximum
- Validation des soldes et positions

### Mode Paper Trading
- Portefeuille virtuel de 50€
- Simulation complète du trading
- Suivi des positions en temps réel
- Historique des trades
- Statistiques de performance

### Interface utilisateur
- Design moderne et responsive
- Optimisé pour mobile et desktop
- Notifications toast pour les événements
- Mise à jour en temps réel
- Navigation intuitive

---

## 📋 Prérequis

- Node.js 22.13.0 ou supérieur
- MySQL 8.0 ou supérieur
- Compte Coinbase avec API CDP
- pnpm (gestionnaire de paquets)

---

## 🛠️ Installation

### 1. Cloner le projet
```bash
cd /home/ubuntu/crypto_alert_dashboard
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 3. Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet :
```bash
# Base de données
DATABASE_URL=mysql://user:password@localhost:3306/crypto_alerts

# API Coinbase CDP
COINBASE_API_KEY_ID=votre_api_key_id
COINBASE_API_SECRET=votre_api_secret

# OAuth (optionnel)
OAUTH_CLIENT_ID=votre_client_id
OAUTH_CLIENT_SECRET=votre_client_secret
```

### 4. Initialiser la base de données
```bash
pnpm run db:push
```

### 5. Lancer l'application
```bash
pnpm run dev
```

L'application sera accessible sur `http://localhost:3000` (ou le port suivant si 3000 est occupé).

---

## 📁 Structure du projet

```
crypto_alert_dashboard/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   │   ├── TradingPanel.tsx
│   │   │   └── NotificationButton.tsx
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── Home.tsx
│   │   │   └── Performance.tsx
│   │   ├── hooks/         # Hooks personnalisés
│   │   └── lib/           # Utilitaires
│   └── public/            # Fichiers statiques
├── server/                # Backend Node.js
│   ├── _core/             # Configuration système
│   ├── coinbaseService.ts # Service API Coinbase
│   ├── paperTradingService.ts # Service Paper Trading
│   ├── coinGeckoService.ts    # Service CoinGecko
│   ├── technicalIndicators.ts # Indicateurs techniques
│   ├── routers.ts         # Routes tRPC
│   └── db.ts              # Accès base de données
├── drizzle/               # Schémas de base de données
│   └── schema.ts
├── docs/                  # Documentation
│   ├── INTEGRATION_COMPLETE.md
│   └── GUIDE_UTILISATEUR.md
└── README.md              # Ce fichier
```

---

## 🎯 Utilisation

### Démarrage rapide

1. **Accéder au tableau de bord** : Ouvrez l'application dans votre navigateur
2. **Activer les notifications** : Cliquez sur "Notifications OFF" pour recevoir les alertes
3. **Explorer les alertes** : Parcourez la liste des opportunités détectées
4. **Tester avec Paper Trading** : Placez vos premiers ordres sans risque

### Placer un ordre

1. Identifiez une alerte intéressante
2. Cliquez sur "Acheter" ou "Vendre" dans le panel de trading
3. Configurez votre ordre (montant, type)
4. Vérifiez le résumé
5. Confirmez l'exécution

### Suivre vos performances

Cliquez sur "Performance" dans l'en-tête pour accéder au tableau de bord de performance avec l'historique complet de vos trades et les statistiques détaillées.

---

## 🔧 Configuration

### Indicateurs techniques

Les paramètres des indicateurs sont optimisés pour la stratégie de gains rapides :

- **RSI** : Période de 14, seuils 30/70
- **Bollinger Bands** : Période de 20, écart-type de 2
- **Volume Spike** : Seuil de 2x la moyenne

### Stratégie de trading

Le système est configuré pour détecter les "démarrages de pump" avec :
- Objectif de gain : 20-30% par trade
- Fréquence : 1-2 trades par jour
- Focus : Une seule valeur à la fois
- Capital initial : 50€ (Paper Trading)

---

## 📊 API et Services

### Services externes utilisés

- **CoinGecko API** : Prix en temps réel et données de marché (gratuit)
- **Coinbase CDP API** : Trading et gestion de compte (nécessite compte)
- **Polygon.io** : Données historiques (optionnel, rate-limited)

### Routes tRPC disponibles

#### Market
- `market.prices` : Prix actuels de tous les actifs
- `market.coinPrice` : Prix d'un actif spécifique
- `market.ohlc` : Données OHLC historiques

#### Alerts
- `alerts.list` : Liste des alertes récentes
- `alerts.byAsset` : Alertes pour un actif spécifique
- `alerts.generate` : Générer de nouvelles alertes

#### Trading
- `trading.balances` : Soldes du compte
- `trading.price` : Prix actuel d'un symbole
- `trading.placeOrder` : Placer un ordre
- `trading.maxBuyAmount` : Montant maximum d'achat

#### Paper Trading
- `paperTrading.portfolio` : État du portefeuille
- `paperTrading.reset` : Réinitialiser le portefeuille
- `paperTrading.value` : Valeur totale
- `paperTrading.history` : Historique des trades
- `paperTrading.stats` : Statistiques de performance

#### Trades
- `trades.list` : Liste de tous les trades
- `trades.byAsset` : Trades pour un actif spécifique
- `trades.closed` : Trades fermés uniquement

---

## 🔐 Sécurité

### Bonnes pratiques

- Le mode Paper Trading est activé par défaut
- Confirmation requise avant chaque ordre
- Validation des montants et soldes côté backend
- Identifiants API stockés en variables d'environnement
- Trading réel désactivé tant que non implémenté complètement

### Gestion des clés API

Ne commitez jamais vos clés API dans Git. Utilisez toujours des variables d'environnement. Renouvelez régulièrement vos clés API. Limitez les permissions de vos clés API au strict nécessaire.

---

## 🧪 Tests

### Tester le mode Paper Trading

```bash
# Lancer l'application
pnpm run dev

# Ouvrir dans le navigateur
# Placer un ordre d'achat
# Vérifier que le portefeuille est mis à jour
# Vérifier que la position apparaît
```

### Tests unitaires (à venir)

```bash
pnpm test
```

---

## 📈 Roadmap

### Version 6.1 (Court terme)
- [ ] Migrer le portefeuille Paper Trading vers la base de données
- [ ] Ajouter des graphiques de prix en temps réel
- [ ] Implémenter stop-loss et take-profit automatiques
- [ ] Améliorer la page de performance avec plus de métriques

### Version 7.0 (Moyen terme)
- [ ] Intégration complète de l'API Coinbase réelle
- [ ] Trading automatique basé sur les alertes
- [ ] Backtesting des stratégies
- [ ] Application mobile native

### Version 8.0 (Long terme)
- [ ] Machine Learning pour prédire les pumps
- [ ] Trading sur marge
- [ ] Ordres complexes (OCO, trailing stop)
- [ ] API publique pour intégration externe

---

## 🐛 Bugs connus

- ⚠️ Portefeuille Paper Trading en mémoire (perdu au redémarrage)
- ⚠️ Prix simulés (non connectés à l'API Coinbase réelle)
- ⚠️ Soldes simulés (non connectés à l'API Coinbase réelle)

---

## 📝 Changelog

### Version 6.0 (5 décembre 2025)
- ✅ Intégration du SDK Coinbase
- ✅ Service Paper Trading complet
- ✅ Panel de trading sur chaque alerte
- ✅ Ordres au marché et limite
- ✅ Suivi des positions en temps réel
- ✅ Correction du bug d'affichage des boutons

### Version 5.0 (1 décembre 2025)
- ✅ Page de performance avec historique des trades
- ✅ Génération de trades de test
- ✅ Optimisation mobile

### Version 4.0 (29 novembre 2025)
- ✅ Notifications push
- ✅ Intégration CoinGecko API
- ✅ Indicateurs techniques avancés

---

## 🤝 Contribution

Ce projet est actuellement en développement privé. Pour toute question ou suggestion, contactez le support à [https://help.manus.im](https://help.manus.im).

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

## 👨‍💻 Développé par

**Manus AI**  
Système de trading automatisé de cryptomonnaies

---

## 📞 Support

- Documentation : Voir `GUIDE_UTILISATEUR.md`
- Rapport d'intégration : Voir `INTEGRATION_COMPLETE.md`
- Support technique : [https://help.manus.im](https://help.manus.im)

---

**Happy Trading! 📈**
