# Crypto Alert Dashboard - TODO

## Fonctionnalités à implémenter

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
- [ ] Créer un checkpoint final
- [ ] Livrer l'application web à l'utilisateur
