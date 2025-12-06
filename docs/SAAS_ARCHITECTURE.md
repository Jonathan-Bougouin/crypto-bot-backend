# Architecture Plateforme SaaS - Crypto Trading Bot

## 🎯 Vision

Transformer le système de trading en **plateforme SaaS multi-tenant** permettant à des clients de :
- S'abonner mensuellement
- Intégrer leur propre clé API Coinbase
- Utiliser le bot de trading automatisé
- Gérer leur portefeuille et stratégies

---

## 🏗️ Architecture Multi-Tenant

### Principe de Base

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATEFORME SAAS                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Client 1   │  │  Client 2   │  │  Client N   │        │
│  │             │  │             │  │             │        │
│  │  - API Key  │  │  - API Key  │  │  - API Key  │        │
│  │  - Bot      │  │  - Bot      │  │  - Bot      │        │
│  │  - Wallet   │  │  - Wallet   │  │  - Wallet   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │         Gestionnaire Multi-Tenant             │         │
│  │  - Isolation des données                      │         │
│  │  - Gestion des ressources                     │         │
│  │  - Monitoring par client                      │         │
│  └───────────────────────────────────────────────┘         │
│                                                             │
│  ┌───────────────────────────────────────────────┐         │
│  │         Services Partagés                     │         │
│  │  - Collecte de données marché                 │         │
│  │  - Modèles ML (partagés)                      │         │
│  │  - Infrastructure                             │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modèle de Données

### 1. Utilisateurs (Users)

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique
  passwordHash: string;          // Bcrypt
  
  // Profil
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastLogin: Date;
  
  // Abonnement
  subscriptionId: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  subscriptionPlan: 'starter' | 'pro' | 'enterprise';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  trialEndsAt?: Date;
  
  // Facturation
  stripeCustomerId: string;
  billingEmail: string;
  
  // Statut
  isActive: boolean;
  isEmailVerified: boolean;
  role: 'user' | 'admin';
}
```

### 2. Clés API Coinbase (ApiKeys)

```typescript
interface CoinbaseApiKey {
  id: string;
  userId: string;                // Foreign key
  
  // Clés chiffrées
  apiKeyId: string;              // Chiffré
  apiSecret: string;             // Chiffré avec clé unique par user
  
  // Métadonnées
  nickname: string;              // Ex: "Mon compte principal"
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  
  // Validation
  isValid: boolean;
  lastValidationAt: Date;
  validationError?: string;
}
```

### 3. Configuration Bot (BotConfigs)

```typescript
interface BotConfig {
  id: string;
  userId: string;
  
  // Configuration générale
  totalCapital: number;
  paperTrading: boolean;
  autoTrade: boolean;
  
  // Limites
  maxDailyTrades: number;
  maxOpenPositions: number;
  riskPerTrade: number;
  
  // Stratégies actives
  strategies: {
    scalping: { enabled: boolean; allocation: number };
    swing: { enabled: boolean; allocation: number };
    trend: { enabled: boolean; allocation: number };
    sentiment: { enabled: boolean; allocation: number };
  };
  
  // État
  isRunning: boolean;
  startedAt?: Date;
  stoppedAt?: Date;
}
```

### 4. Positions (Positions)

```typescript
interface Position {
  id: string;
  userId: string;
  botConfigId: string;
  
  // Trade
  symbol: string;
  side: 'buy' | 'sell';
  strategy: string;
  
  // Prix
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  
  // Quantité
  quantity: number;
  investedAmount: number;
  currentValue: number;
  
  // P&L
  profitLoss: number;
  profitLossPercent: number;
  
  // Gestion du risque
  stopLoss: number;
  takeProfit: number;
  
  // Dates
  openTime: Date;
  closeTime?: Date;
  
  // Statut
  status: 'open' | 'closed';
  closeReason?: 'manual' | 'stop-loss' | 'take-profit' | 'signal';
}
```

### 5. Abonnements (Subscriptions)

```typescript
interface Subscription {
  id: string;
  userId: string;
  
  // Stripe
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  
  // Plan
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  
  // Dates
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  
  // Facturation
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}
```

---

## 💳 Plans d'Abonnement

### Plan Starter (29€/mois)
- 1 clé API Coinbase
- Capital max : 1,000€
- 2 stratégies actives
- 10 trades/jour max
- 3 positions ouvertes max
- Support email
- Données en temps réel

### Plan Pro (79€/mois)
- 3 clés API Coinbase
- Capital max : 10,000€
- 4 stratégies actives
- 50 trades/jour max
- 10 positions ouvertes max
- Support prioritaire
- Backtesting avancé
- Alertes personnalisées

### Plan Enterprise (199€/mois)
- Clés API illimitées
- Capital illimité
- Toutes les stratégies
- Trades illimités
- Positions illimitées
- Support dédié
- API personnalisée
- Rapports avancés
- White-label (option)

---

## 🔐 Sécurité

### Chiffrement des Clés API

```typescript
// Chiffrement AES-256-GCM avec clé unique par utilisateur
class ApiKeyEncryption {
  // Générer une clé de chiffrement pour l'utilisateur
  generateUserKey(userId: string, masterKey: string): string {
    return crypto.pbkdf2Sync(
      userId,
      masterKey,
      100000,
      32,
      'sha256'
    ).toString('hex');
  }
  
  // Chiffrer une clé API
  encrypt(apiKey: string, userKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', userKey, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  // Déchiffrer une clé API
  decrypt(encryptedKey: string, userKey: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedKey.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', userKey, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Isolation des Données

- **Base de données** : Chaque requête filtrée par `userId`
- **Cache** : Clés préfixées par `userId`
- **Fichiers** : Stockés dans des dossiers séparés par `userId`
- **Logs** : Séparés et anonymisés par utilisateur

---

## 🚀 Scalabilité

### Architecture Horizontale

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │ Server 1│      │ Server 2│     │ Server N│
    │         │      │         │     │         │
    │ - API   │      │ - API   │     │ - API   │
    │ - Bots  │      │ - Bots  │     │ - Bots  │
    └────┬────┘      └────┬────┘     └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Redis Cluster       │
              │   (Cache + Queue)     │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   PostgreSQL          │
              │   (Primary + Replica) │
              └───────────────────────┘
```

### Gestion des Ressources

```typescript
interface ResourceLimits {
  maxBotsPerServer: number;        // 100 bots/serveur
  maxPositionsPerBot: number;      // Selon le plan
  maxApiCallsPerMinute: number;    // Rate limiting
  maxMemoryPerBot: number;         // 50MB/bot
  maxCpuPerBot: number;            // 5% CPU/bot
}
```

---

## 📈 Monitoring & Analytics

### Métriques par Client

- Nombre de trades
- ROI total et par stratégie
- Taux de réussite
- Capital évolution
- Positions ouvertes/fermées
- Erreurs API
- Temps de réponse

### Métriques Plateforme

- Nombre d'utilisateurs actifs
- Revenus mensuels récurrents (MRR)
- Taux de churn
- Utilisation des ressources
- Performance des bots
- Incidents et downtime

---

## 💰 Modèle de Revenus

### Revenus Directs

1. **Abonnements mensuels**
   - Starter : 29€/mois × N clients
   - Pro : 79€/mois × N clients
   - Enterprise : 199€/mois × N clients

2. **Options additionnelles**
   - Backtesting avancé : +10€/mois
   - Alertes SMS : +5€/mois
   - API access : +20€/mois

### Revenus Indirects

3. **Programme d'affiliation**
   - 20% de commission récurrente
   - Paiement mensuel automatique
   - Dashboard affilié

4. **White-label**
   - Licence : 500€/mois
   - Setup : 2,000€ one-time

---

## 🎯 Roadmap de Lancement

### Phase 1 : MVP (Mois 1-2)
- ✅ Bot de base fonctionnel
- ✅ Intégration Coinbase
- 🔄 Authentification utilisateurs
- 🔄 Système d'abonnement Stripe
- 🔄 Dashboard client basique

### Phase 2 : Beta (Mois 3)
- Tests avec 10-20 beta testeurs
- Optimisation des stratégies
- Correction des bugs
- Amélioration UX

### Phase 3 : Lancement (Mois 4)
- Ouverture au public
- Marketing et acquisition
- Support client
- Monitoring 24/7

### Phase 4 : Croissance (Mois 5-12)
- Nouvelles fonctionnalités
- Optimisation ML
- Expansion internationale
- Partenariats

---

## 📊 Objectifs Business

### Année 1
- **Utilisateurs** : 100 clients payants
- **MRR** : 5,000€/mois
- **Churn** : <10%
- **ROI moyen** : >30%/mois

### Année 2
- **Utilisateurs** : 500 clients
- **MRR** : 30,000€/mois
- **Expansion** : 3 nouveaux marchés
- **Team** : 5 personnes

### Année 3
- **Utilisateurs** : 2,000 clients
- **MRR** : 120,000€/mois
- **Levée de fonds** : Série A
- **Produits** : 3 bots différents

---

**Date** : 5 décembre 2025  
**Version** : 1.0  
**Statut** : Architecture définie ✅
