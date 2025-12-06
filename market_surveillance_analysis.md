# Analyse de Faisabilité : Surveillance de Marché Étendue (Top 100 vs Top 500)

## 1. Résumé Exécutif

Suite à votre demande d'étendre la surveillance à l'ensemble des 500+ cryptomonnaies disponibles sur Coinbase, nous avons mené une simulation technique et une analyse financière. 

**Conclusion principale :** La surveillance du **Top 500 est techniquement réalisable** mais nécessite une infrastructure dédiée (VPS) pour rester économiquement viable (~5€/mois). L'hébergement PaaS (Railway) deviendrait prohibitif (~40-90$/mois) pour ce volume de données.

## 2. Analyse Technique (Simulation de Charge)

Nous avons simulé la charge serveur nécessaire pour surveiller 500 paires de trading en temps réel (WebSocket Orderbook + Candles).

| Métrique | Top 100 (Estimé) | Top 500 (Simulé) | Impact |
| :--- | :--- | :--- | :--- |
| **Mémoire RAM** | ~600 MB | **~2.5 GB** | x4.2 |
| **Usage CPU** | ~2% | **~7.5%** | x3.75 |
| **Bande Passante** | ~0.3 Mbps | **~1.5 Mbps** | x5 |
| **Connexions WS** | 1 | **2** | Limite Coinbase (Max 300 paires/conn) |

> **Note Technique :** La consommation de RAM est le facteur limitant principal. Chaque paire nécessite de stocker un historique de bougies et d'indicateurs en mémoire pour une analyse rapide. Avec 500 paires, nous atteignons 2.5 GB de RAM, ce qui dépasse les offres "gratuites" ou "hobby" de la plupart des hébergeurs.

## 3. Analyse Financière (Coûts d'Hébergement)

Le choix de l'infrastructure impacte radicalement le coût mensuel pour une charge de 4GB RAM (nécessaire pour sécuriser les 2.5GB utilisés + OS + marge).

### Option A : PaaS (Railway, Render) - *Facilité maximale, Coût élevé*
Ces plateformes gèrent tout (déploiement, SSL, redémarrage), mais facturent la RAM à prix fort.
*   **Railway :** ~$40 - $90 / mois [1] [2]
    *   Modèle : $10/GB/mois + CPU. Pour 4GB : ~$40/mois juste pour la RAM.
*   **Render :** ~$95 / mois [3]

### Option B : VPS Cloud (Hetzner, DigitalOcean) - *Performance/Prix optimal*
Serveurs virtuels bruts. Nécessite une configuration manuelle (que je peux automatiser).
*   **Hetzner (CX22) :** **~3.79€ / mois** [4]
    *   Specs : 2 vCPU, 4 GB RAM, 40 GB Disk.
    *   Avantage : Rapport qualité/prix imbattable en Europe.
*   **DigitalOcean :** ~$24 / mois [5]
    *   Specs : 2 vCPU, 4 GB RAM.

## 4. Recommandation Stratégique

### Option Recommandée : "Le Grand Saut" (Top 500 sur VPS Hetzner)
Puisque votre objectif est de maximiser les opportunités et que vous êtes prêt à investir ~5€/mois, passer directement au Top 500 sur un VPS Hetzner est la stratégie la plus logique.

*   **Coût :** ~4-5€ / mois (Hetzner CX22)
*   **Couverture :** 100% du marché Coinbase
*   **Complexité :** Moyenne (Je dois configurer le VPS pour vous, au lieu d'un simple déploiement Railway)
*   **Avantage Concurrentiel :** Votre bot verra des opportunités sur des "small caps" que les autres ignorent.

### Option Alternative : "Prudence" (Top 100 sur Railway)
Si vous refusez absolument de gérer un VPS ou voulez la simplicité totale de Railway.
*   **Coût :** ~$10-15 / mois (Railway Starter)
*   **Couverture :** 20% du marché (les plus grosses)
*   **Complexité :** Faible

## 5. Plan d'Action Immédiat

Si vous validez l'option **Top 500 sur VPS**, voici les prochaines étapes :
1.  **Code :** Je finalise le `DataManager` pour gérer le partitionnement des WebSockets (2 connexions pour 500 paires).
2.  **Infrastructure :** Je prépare un script `setup_vps.sh` qui installera tout le nécessaire (Docker, Node.js, Base de données) sur votre futur VPS.
3.  **Déploiement :** Vous louerez le serveur (je vous guiderai), et nous déploierons le "Monstre" dessus.

---
**Références :**
[1] Railway Pricing - https://railway.com/pricing
[2] Railway Docs - https://docs.railway.com/reference/pricing/plans
[3] Railway vs Render Pricing - https://getdeploying.com/railway-vs-render
[4] Hetzner Cloud Pricing - https://www.hetzner.com/news/new-cx-plans/
[5] DigitalOcean Pricing - https://www.digitalocean.com/pricing/droplets
