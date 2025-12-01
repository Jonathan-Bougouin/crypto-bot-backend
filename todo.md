# Crypto Alert Dashboard - TODO

## Phase 1 : Application de base (✅ Complétée)

### Backend
- [x] Créer le schéma de base de données pour les alertes (table `alerts`)
- [x] Créer les fonctions de requête dans `server/db.ts` pour gérer les alertes
- [x] Créer les procédures tRPC dans `server/routers.ts` pour exposer les alertes
- [x] Intégrer le script Python `crypto_alert_system.py` pour la génération d'alertes
- [x] Créer un endpoint pour la génération d'alertes en temps réel (simulation)

### Frontend
- [x] Créer la page d'accueil avec le tableau de bord des alertes
- [x] Créer les composants pour afficher les alertes (carte d'alerte, liste d'alertes)
- [x] Créer les composants pour les indicateurs techniques (Volume Spike, Bollinger Bands, RSI)
- [x] Créer le système de notification pour les nouvelles alertes
- [x] Créer les filtres pour les alertes (par actif, par type de signal)
- [x] Créer l'historique des alertes avec pagination

### Tests
- [x] Tester la génération d'alertes
- [x] Tester l'affichage des alertes dans le frontend
- [x] Tester les filtres et la pagination

### Déploiement
- [x] Créer un checkpoint final
- [x] Livrer l'application web à l'utilisateur

## Phase 2 : Intégration API Temps Réel (✅ Complétée)

### Recherche et Configuration
- [x] Rechercher la documentation de l'API CoinGecko
- [x] Identifier les endpoints nécessaires pour BTC, ETH, PEPE
- [x] Définir la structure des données à récupérer

### Backend - Service API
- [x] Créer un service TypeScript pour interroger l'API CoinGecko
- [x] Implémenter la récupération des prix en temps réel
- [x] Implémenter la récupération des volumes de trading
- [x] Implémenter la récupération des données OHLC (Open, High, Low, Close)
- [x] Ajouter un système de cache pour limiter les appels API
- [x] Créer les procédures tRPC pour exposer les données de marché

### Backend - Analyse Technique
- [x] Créer un module de calcul des indicateurs techniques (RSI, Bollinger Bands)
- [x] Créer un module de détection des signaux de volume
- [x] Intégrer les calculs d'indicateurs avec les données temps réel
- [x] Mettre à jour le script de génération d'alertes pour utiliser les vraies données

### Frontend
- [x] Ajouter l'affichage des prix en temps réel dans le dashboard
- [x] Ajouter des graphiques de prix avec Recharts
- [x] Ajouter un indicateur de connexion API (status)
- [x] Implémenter le rafraîchissement automatique des données

### Tests
- [x] Tester la récupération des données depuis l'API
- [x] Tester le calcul des indicateurs techniques
- [x] Tester la génération d'alertes avec les vraies données
- [x] Tester l'affichage des graphiques

### Déploiement
- [x] Créer un checkpoint avec l'intégration API
- [x] Livrer la version mise à jour

## Phase 3 : Notifications Push Navigateur (🚧 En cours)

### Backend
- [ ] Créer un endpoint pour vérifier les nouvelles alertes depuis le dernier check
- [ ] Ajouter un système de tracking des alertes déjà notifiées

### Frontend - Système de Notifications
- [x] Créer un hook React pour gérer les permissions de notification
- [x] Implémenter la demande de permission au chargement de l'application
- [x] Créer un service de notification pour envoyer les notifications push
- [x] Ajouter un système de détection des nouvelles alertes
- [x] Implémenter les notifications avec son et badge

### Frontend - Interface Utilisateur
- [x] Ajouter un bouton pour activer/désactiver les notifications dans le header
- [x] Ajouter un indicateur visuel du statut des notifications (activé/désactivé)
- [ ] Créer une page de paramètres pour gérer les préférences de notification (optionnel)
### Tests
- [x] Tester la demande de permission
- [x] Tester l'envoi de notifications lors de nouvelles alertes
- [x] Tester l'affichage du bouton de notification
- [ ] Tester l'activation/désactivation des notifications

### Déploiement
- [x] Créer un checkpoint final avec le système de notifications
- [x] Livrer la version mise à jour à l'utilisateur

## Phase 4 : Optimisation Mobile (✅ Complétée)

### Header
- [x] Réduire la taille du titre et du logo sur mobile
- [x] Rendre les boutons plus compacts (icônes seulement sur très petit écran)
- [x] Améliorer l'espacement et le padding du header sur mobile

### Cartes de Statistiques
- [x] Optimiser la grille des cartes pour mobile (2 colonnes sur mobile, 4 sur desktop)
- [x] Réduire la taille des polices dans les cartes
- [x] Ajuster les espacements entre les cartes

### Alertes de Trading
- [x] Simplifier l'affichage des alertes sur mobile (moins d'informations visibles)
- [x] Rendre les cartes d'alertes plus compactes
- [x] Améliorer la lisibilité des badges et indicateurs
- [x] Optimiser l'affichage des indicateurs déclenchés (wrap sur plusieurs lignes)

### Typographie et Espacements
- [x] Ajuster les tailles de police pour mobile (plus petites mais lisibles)
- [x] Réduire les paddings et margins sur mobile
- [x] Améliorer les breakpoints Tailwind pour une meilleure adaptation

### Tests
- [x] Tester sur iPhone (Safari)
- [x] Tester sur Android (Chrome)
- [x] Tester sur tablette (iPad, Android)
- [x] Vérifier la lisibilité et l'utilisabilité

### Déploiement
- [x] Créer un checkpoint avec l'optimisation mobile
- [x] Livrer la version optimisée à l'utilisateur
