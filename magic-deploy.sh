#!/bin/bash

# ==============================================================================
# 🚀 MAGIC DEPLOY SCRIPT - CRYPTO BOT PRO (TOP 500 EDITION)
# ==============================================================================
# Ce script installe et configure automatiquement tout l'environnement sur un VPS vierge.
# Compatible : Ubuntu 22.04 / 24.04 LTS
# Auteur : Manus AI pour Lucian Shadowborn Production
# ==============================================================================

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=================================================================="
echo "   🔮 INSTALLATION AUTOMATIQUE - CRYPTO BOT PRO (TOP 500) 🔮"
echo "=================================================================="
echo -e "${NC}"

# 1. Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Ce script doit être exécuté en tant que root (ou avec sudo).${NC}"
  exit 1
fi

# 2. Mise à jour du système
echo -e "${GREEN}📦 [1/6] Mise à jour du système...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl git unzip ufw fail2ban build-essential

# 3. Installation de Node.js 20 (LTS)
echo -e "${GREEN}🟢 [2/6] Installation de Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# 4. Configuration du Pare-feu (Sécurité)
echo -e "${GREEN}🛡️ [3/6] Sécurisation du serveur (Firewall)...${NC}"
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# 5. Clonage et Installation du Projet
echo -e "${GREEN}📥 [4/6] Récupération du code source...${NC}"
# Configuration du dossier
mkdir -p /var/www/crypto-bot
cd /var/www/crypto-bot

# Clonage du repository
echo "Clonage du repository..."
git clone https://github.com/Jonathan-Bougouin/crypto-bot-backend.git .

# Installation des dépendances
echo -e "${GREEN}📦 [5/6] Installation des dépendances...${NC}"
pnpm install
pnpm build

# Configuration des variables d'environnement (Interactive)
echo -e "${BLUE}🔑 Configuration des Clés API (Appuyez sur Entrée pour passer si déjà configuré)${NC}"
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

# Fonction pour demander une variable si elle n'existe pas
ask_var() {
    local var_name=$1
    local prompt_text=$2
    local current_val=$(grep "^$var_name=" .env | cut -d '=' -f2-)
    
    if [ -z "$current_val" ]; then
        read -p "$prompt_text: " user_input
        if [ ! -z "$user_input" ]; then
            echo "$var_name=$user_input" >> .env
        fi
    else
        echo "$var_name est déjà configuré."
    fi
}

ask_var "COINBASE_API_KEY_ID" "Entrez votre COINBASE_API_KEY_ID"
ask_var "COINBASE_API_SECRET" "Entrez votre COINBASE_API_SECRET"
ask_var "JWT_SECRET" "Entrez un secret pour JWT (ou laissez vide pour générer auto)"

# Génération auto du JWT si vide
if ! grep -q "JWT_SECRET" .env; then
    echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
fi

# 6. Démarrage avec PM2 (Gestionnaire de processus)
echo -e "${GREEN}🚀 [6/6] Démarrage du Bot Top 500...${NC}"
pm2 start dist/server/index.js --name "crypto-bot-pro"
pm2 save
pm2 startup

echo -e "${BLUE}"
echo "=================================================================="
echo "   ✅ INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo "=================================================================="
echo "   Votre bot surveille maintenant le Top 500 des cryptos."
echo "   Dashboard accessible sur : http://$(curl -s ifconfig.me)"
echo "=================================================================="
echo -e "${NC}"
