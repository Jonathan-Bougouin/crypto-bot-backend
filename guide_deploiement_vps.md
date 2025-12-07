# Guide de Déploiement "Zéro Technique" - CryptoBot Pro (Top 500)

Ce guide est conçu pour vous permettre de déployer votre bot de trading sur un serveur professionnel (VPS) sans aucune connaissance technique préalable.

**Temps estimé :** 10 minutes
**Coût :** ~9€ / mois (Hetzner CX32 - Recommandé pour Top 500)

---

## Étape 1 : Louer le Serveur (Hetzner)

1.  Allez sur [Hetzner Cloud](https://console.hetzner.cloud/) et créez un compte.
2.  Cliquez sur **"New Project"** et nommez-le `CryptoBot`.
3.  Cliquez sur **"Add Server"** et sélectionnez exactement ces options :
    *   **Location :** Falkenstein ou Nuremberg (Allemagne)
    *   **Image :** Ubuntu 24.04
    *   **Type :** Shared vCPU (x86) -> **CX32** (4 vCPU / 8 GB RAM) - *Option recommandée pour le Top 500 (~9€)*
    *   **Networking :** Laissez par défaut (Public IPv4)
    *   **SSH Keys :** (Optionnel, vous recevrez un mot de passe par email si vous ne mettez rien)
4.  Cliquez sur **"Create & Buy"**.

> 📧 Vous allez recevoir un email avec l'adresse IP de votre serveur (ex: `123.45.67.89`) et le mot de passe `root`.

---

## Étape 2 : Lancer la Commande Magique

C'est la seule étape "technique". Vous allez vous connecter au serveur et coller une commande.

### Sur Windows :
1.  Ouvrez l'application **"Invite de commandes"** (ou PowerShell).
2.  Tapez : `ssh root@VOTRE_IP` (remplacez `VOTRE_IP` par l'IP reçue par email).
3.  Tapez `yes` si on vous demande une confirmation.
4.  Entrez le mot de passe reçu par email (attention, rien ne s'affiche quand vous tapez, c'est normal !).
5.  On vous demandera de changer le mot de passe immédiatement. Entrez l'ancien, puis le nouveau deux fois.

### Une fois connecté (vous voyez `root@ubuntu:~#`) :
Copiez et collez cette commande unique, puis appuyez sur Entrée :

```bash
curl -sL https://raw.githubusercontent.com/Jonathan-Bougouin/crypto-bot-backend/main/magic-deploy.sh | bash
```

*(Note : Cette commande téléchargera et exécutera le script d'installation automatique que j'ai préparé)*

---

## Étape 3 : C'est fini !

Le script va travailler pendant environ 3-5 minutes. Vous verrez des lignes de texte défiler (installation de Node.js, sécurisation du pare-feu, démarrage du bot...).

À la fin, il affichera :
✅ **INSTALLATION TERMINÉE AVEC SUCCÈS !**

Vous pourrez alors accéder à votre dashboard via : `http://VOTRE_IP`

---

## FAQ & Dépannage

**Q: Est-ce sécurisé ?**
R: Oui, le script installe un pare-feu (UFW) qui bloque tout sauf le strict nécessaire (SSH et Web).

**Q: Et si le serveur redémarre ?**
R: Le bot est configuré avec PM2 pour redémarrer automatiquement au lancement du serveur.

**Q: Comment mettre à jour le bot ?**
R: Il suffira de relancer la même commande "magique", elle détectera que c'est une mise à jour.
