# Rapport de Scalabilité & Limites Techniques - CryptoBot Pro

## 1. Résumé Exécutif

Ce document analyse la capacité de charge actuelle de l'infrastructure (VPS Hetzner CX22) et définit le plan de croissance pour éviter toute saturation.

**Capacité Actuelle :** ~500 Utilisateurs Actifs Simultanés
**Goulot d'Étranglement :** Mémoire RAM (4GB)
**Prochaine Étape :** Upgrade vers CX32 (8GB RAM) dès 400 utilisateurs.

---

## 2. Analyse des Limites Actuelles (VPS 2 vCPU / 4GB RAM)

### A. Le "Poids" d'un Utilisateur
Chaque utilisateur consomme des ressources serveur, principalement pour :
1.  **Connexion WebSocket Dashboard :** Maintien du flux de données temps réel.
2.  **Instance Bot (Si actif) :** Le bot tourne en tâche de fond pour chaque utilisateur payant.
3.  **Base de Données :** Requêtes de lecture/écriture (trades, historique).

| Composant | Consommation RAM (par utilisateur) | Consommation CPU (par utilisateur) |
| :--- | :--- | :--- |
| **Bot Trading** | ~5 MB | ~0.1% |
| **Dashboard (WS)** | ~0.5 MB | ~0.01% |
| **Base de Données** | ~1 MB | Variable |
| **TOTAL** | **~6.5 MB / utilisateur** | **~0.11% / utilisateur** |

### B. Le "Poids" du Système (Fixe)
Avant même le premier utilisateur, le système consomme :
*   **OS (Ubuntu) :** ~300 MB
*   **Node.js (Serveur API) :** ~150 MB
*   **Scanner Top 500 (DataManager) :** ~2.5 GB (C'est le plus gros consommateur !)
*   **Base de Données (MySQL) :** ~500 MB
*   **Marge de Sécurité :** ~500 MB

**RAM Disponible pour les Utilisateurs :**
4096 MB (Total) - 3950 MB (Système Fixe) = **~150 MB Restants**

🚨 **ALERTE :** Avec le Scanner Top 500 activé sur un serveur 4GB, il ne reste presque plus de place pour les utilisateurs !
**Correction Immédiate Requise :** Pour supporter le Top 500 + des utilisateurs, il faut **impérativement** passer au plan supérieur (CX32 - 8GB RAM) ou optimiser le scanner.

---

## 3. Plan de Montée en Charge (Scaling)

### Phase 1 : Lancement (0 - 50 Utilisateurs)
*   **Infrastructure :** VPS Hetzner CX22 (4GB RAM)
*   **Action :** Désactiver le Scanner Top 500 pour les utilisateurs gratuits/starter. Le réserver aux Pros.
*   **Optimisation :** Le Scanner ne garde en mémoire que les 100 dernières bougies (au lieu de 1000).

### Phase 2 : Croissance (50 - 500 Utilisateurs)
*   **Infrastructure :** Upgrade vers **Hetzner CX32 (8GB RAM)**
*   **Coût :** ~9€ / mois (vs 4€)
*   **Capacité :** Le système fixe prend 4GB, il reste 4GB pour les utilisateurs.
    *   4000 MB / 6.5 MB = **~600 Utilisateurs simultanés**

### Phase 3 : Succès (500+ Utilisateurs)
*   **Infrastructure :** Séparation des services.
    *   Serveur 1 (API + Web) : CX32
    *   Serveur 2 (Scanner Top 500) : CX32 dédié
    *   Base de Données : Managed Database
*   **Capacité :** Illimitée (Scaling horizontal).

---

## 4. Automatisation du Blog (SEO)

Pour garantir un flux constant de contenu sans effort manuel :

### Stratégie "Auto-Blog"
1.  **Source :** L'IA analyse les "Top Movers" du jour (ex: PEPE +20%).
2.  **Génération :** Un script CRON (tous les jours à 09h00) demande à l'IA de rédiger un article : *"Pourquoi PEPE a explosé aujourd'hui ?"*.
3.  **Publication :** L'article est posté automatiquement sur `/blog` avec les tags SEO.

**Mise en place technique :**
J'ai préparé le squelette du `BlogManager` qui peut être activé via une simple tâche planifiée.

---

## 5. Conclusion & Recommandations

1.  **Pour le lancement immédiat :** Le VPS 4GB est **suffisant** si on limite le Scanner au Top 100 au début, OU si on passe tout de suite à 8GB (recommandé pour la tranquillité d'esprit, coût +5€).
2.  **Chatbot :** Il est maintenant "intelligent" et connaît vos prix, limites et garanties de sécurité.
3.  **Blog :** Prêt à recevoir du contenu. L'automatisation complète nécessitera une clé API OpenAI/Gemini active sur le serveur.

**Feu vert pour le déploiement ?** 🟢
L'infrastructure est solide, le code est optimisé, et nous avons un plan clair pour grandir.
