# RAPPORT_J3.md — COINBOT PRO PHASE 1.4

**Document** : Rapport Forward Test — Jour 3  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-07  
**Window** : `2026-03-07T00:00:00Z` → `2026-03-07T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true (aucun trade réel exécuté)  
**Statut** : LIVRABLE J3

---

## 1. Résumé Exécutif

Le Forward Test J3 de COINBOT PRO a été exécuté le **7 mars 2026** (simulé) en mode OBSERVATION pure, en continuité stricte des journées J1 et J2. Le contexte de marché J3 est caractérisé par un **rebond technique modéré** après la correction de J2 : les prix de base sont légèrement supérieurs sur BTC (+1,2%), ETH (+0,8%) et SOL (+2,1%), tandis que PEPE poursuit sa correction (-1,3%).

Cette reprise technique a produit un **effet notable sur la qualité des signaux** : le nombre de signaux triggered est passé de 119 (J2) à 148 (J3), et le nombre de BUY de 4 à 7. SOL-EUR, en forte survente relative sur ce contexte, a généré à lui seul 5 des 7 signaux BUY, illustrant la sensibilité du filtre RSI aux mouvements de prix intra-journaliers sur les actifs à forte volatilité.

---

## 2. Paramètres de la Session

| Paramètre | Valeur |
|-----------|--------|
| Date | 2026-03-07 |
| Window UTC | `2026-03-07T00:00:00Z` → `2026-03-07T23:59:59Z` |
| Mode | OBSERVATION_MODE=true |
| Capital initial | 50,00 EUR |
| Assets surveillés | BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR |
| Fréquence d'évaluation | 1 cycle/heure |
| Durée totale | 24 heures |
| Random seed | 20260307 (reproductible) |
| Risk per trade | 20% du capital |
| Max daily trades | 8 |
| Stratégie | RSI < 35 + MACD > 0 + EMA20 > EMA50 |

---

## 3. Prix de Base J3 vs J2 (Rebond Technique)

| Asset | Prix J2 (EUR) | Prix J3 (EUR) | Variation |
|-------|--------------|--------------|-----------|
| BTC-EUR | 83 200,00 | 84 200,00 | +1,2% |
| ETH-EUR | 2 090,00 | 2 107,00 | +0,8% |
| SOL-EUR | 128,50 | 131,20 | +2,1% |
| PEPE-EUR | 0,0000079 | 0,0000078 | -1,3% |
| BNB-EUR | 510,00 | 513,00 | +0,6% |

Le rebond est général sur 4 des 5 actifs. PEPE-EUR continue sa correction indépendante, ce qui explique l'absence de signal BUY sur cet asset pour le troisième jour consécutif.

---

## 4. Clarification Stratégique : HOLD vs REJECT

Un point de cohérence documentaire important est établi ici pour la série J1→J7 :

**HOLD** désigne toute situation où le moteur de décision ne détecte pas de signal convergent suffisant pour déclencher un trade. Le bot attend sans action. C'est le comportement normal et majoritaire d'une stratégie de qualité qui privilégie la sélectivité.

**REJECT** est réservé exclusivement aux situations où un trade potentiellement valide est **explicitement bloqué par un filtre de sécurité**, en l'occurrence la limite `MAX_DAILY_TRADES=8`. Sur J3, cette limite n'a pas été atteinte (7 BUY < 8), donc `REJECT=0` est parfaitement normal et attendu.

Cette distinction est encodée dans le manifest J3 via le champ `holdVsRejectNote` et sera maintenue pour J4→J7.

---

## 5. Statistiques de Décision

### 5.1 Vue d'ensemble

| Action | Nombre | % du total | Définition |
|--------|--------|-----------|-----------|
| HOLD | 113 | 94,2% | Signal absent ou insuffisant |
| BUY | 7 | 5,8% | Signal RSI+MACD+EMA convergent |
| SELL | 0 | 0,0% | Pas de position ouverte (OBSERVATION) |
| REJECT | 0 | 0,0% | MAX_DAILY_TRADES non atteint |
| **TOTAL** | **120** | **100%** | |

### 5.2 Décisions par Asset

| Asset | BUY | SELL | HOLD | REJECT | Total |
|-------|-----|------|------|--------|-------|
| BTC-EUR | 0 | 0 | 24 | 0 | 24 |
| ETH-EUR | 1 | 0 | 23 | 0 | 24 |
| SOL-EUR | 5 | 0 | 19 | 0 | 24 |
| PEPE-EUR | 0 | 0 | 24 | 0 | 24 |
| BNB-EUR | 1 | 0 | 23 | 0 | 24 |

SOL-EUR domine nettement avec 5 BUY sur 24 évaluations (20,8% de taux de déclenchement). Cette concentration s'explique par la combinaison d'une volatilité intrinsèque élevée (19%) et d'un prix de base en rebond, qui crée des configurations RSI oversold répétées en début de journée.

### 5.3 Détail des 7 Signaux BUY

| Heure | Asset | Prix (EUR) | Quantité | Confiance | RSI | Contexte |
|-------|-------|-----------|---------|-----------|-----|---------|
| 00:00 | SOL-EUR | 128,9232 | 0,07757 | 0,50 | 19,71 | Survente profonde ouverture |
| 01:00 | SOL-EUR | 131,6580 | 0,07595 | 0,50 | 19,59 | Survente maintenue H+1 |
| 03:00 | BNB-EUR | 507,0945 | 0,01972 | 0,64 | 21,79 | Survente modérée BNB |
| 04:00 | SOL-EUR | 131,1858 | 0,07625 | 0,50 | 29,94 | RSI limite seuil 35 |
| 07:00 | SOL-EUR | 128,3552 | 0,07790 | 0,50 | 26,73 | Rechute intra-journalière |
| 08:00 | SOL-EUR | 132,0757 | 0,07572 | 0,57 | 15,29 | Survente extrême H+8 |
| 19:00 | ETH-EUR | 2 129,1855 | 0,00469 | 0,71 | 29,90 | Survente ETH soirée |

Les 5 signaux SOL-EUR entre 00:00 et 08:00 illustrent un phénomène de **survente persistante en début de journée** sur cet actif, typique des marchés crypto en phase de rebond incertain. En mode réel, le bot aurait investi ~10 EUR sur le premier signal et maintenu la position pour les suivants (pas de doublon sur même asset sans SELL intermédiaire).

---

## 6. Analyse des Signaux Techniques

### 6.1 Vue d'ensemble J3

| Indicateur | Total | Triggered | Taux |
|-----------|-------|-----------|------|
| RSI | 120 | 30 | 25,0% |
| MACD | 120 | 51 | 42,5% |
| EMA_CROSS | 120 | 67 | 55,8% |
| **TOTAL** | **360** | **148** | **41,1%** |

### 6.2 Évolution de la Série J1→J3

| Indicateur | J1 | J2 | J3 | Tendance |
|-----------|----|----|----|---------:|
| RSI | 34 | 27 | 30 | Variable |
| MACD | 44 | 39 | 51 | Hausse J3 |
| EMA_CROSS | 53 | 53 | 67 | Hausse J3 |
| **Total** | **131** | **119** | **148** | **Rebond** |

La hausse des signaux MACD (+12 vs J2) et EMA_CROSS (+14 vs J2) est cohérente avec le contexte de rebond technique : les moyennes mobiles et le momentum tendent à s'aligner positivement lors des reprises de marché.

---

## 7. Évolution de l'Equity

L'equity reste stable à **50,00 EUR** sur les 24 snapshots horaires, confirmant que OBSERVATION_MODE=true est actif. Aucun trade réel n'a modifié le portefeuille.

| Heure | Cash (EUR) | Positions (EUR) | Equity (EUR) | PnL |
|-------|-----------|----------------|-------------|----:|
| 00:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 06:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 12:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 18:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 23:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |

---

## 8. Analyse Comparative J1→J3

### 8.1 Tableau de Bord de la Série

| Métrique | J1 | J2 | J3 | Commentaire |
|---------|----|----|----|-----------:|
| BUY | 4 | 4 | 7 | Rebond J3 |
| HOLD | 116 | 116 | 113 | Cohérent |
| REJECT | 0 | 0 | 0 | Normal |
| Triggered total | 131 | 119 | 148 | Rebond J3 |
| RSI triggered | 34 | 27 | 30 | Stable |
| MACD triggered | 44 | 39 | 51 | Hausse J3 |
| EMA_CROSS triggered | 53 | 53 | 67 | Hausse J3 |

### 8.2 Interprétation de la Variabilité

La variabilité observée entre J1, J2 et J3 est **attendue et saine** : elle reflète la sensibilité du moteur de décision aux conditions de marché, sans pour autant trahir une instabilité algorithmique. Les paramètres structurels (120 décisions, 360 signaux, 24 snapshots) restent constants, confirmant la robustesse de l'architecture.

La concentration des BUY sur SOL-EUR en J3 est un signal d'information utile pour la phase de production : cet actif nécessitera potentiellement un filtre de position unique (pas de doublon sans SELL) pour éviter la sur-exposition en mode réel.

---

## 9. Intégrité des Exports J3

| Fichier | Taille | Records | SHA256 |
|---------|--------|---------|--------|
| `decisions.jsonl` | ~56 Ko | 120 | `fdee5dbd606b9f01...` |
| `signals.jsonl` | ~75 Ko | 360 | `2255e2fd643993f6...` |
| `equity.csv.jsonl` | ~5 Ko | 24 | `71317cc64fbeb508...` |
| `checksums.txt` | 245 B | — | — |
| `manifest.json` | ~1,5 Ko | — | — |

Tous les checksums correspondent aux valeurs enregistrées dans `manifest.json`. **Intégrité : VALIDÉE — 3/3 MATCH.**

---

## 10. Conclusion J3

Le Forward Test J3 est **VALIDÉ**. La série J1→J3 est propre, cohérente et reproductible. Le rebond technique de J3 a été correctement capturé par le moteur de décision, produisant plus de signaux BUY de qualité (+75% vs J2) sans dépasser la limite de sécurité MAX_DAILY_TRADES.

| Critère | Résultat | Statut |
|---------|----------|--------|
| OBSERVATION_MODE actif | Equity stable 50 EUR | PASS |
| Window UTC calée J3 | `2026-03-07T00:00:00Z → 23:59:59Z` | PASS |
| Dataset complet | 120 + 360 + 24 records | PASS |
| Intégrité SHA256 | manifest == sha256sum | PASS |
| Cohérence cadence J1→J3 | 120/360/24 constant | PASS |
| HOLD ≠ REJECT documenté | manifest + rapport | PASS |
| Zéro crash | Aucune exception | PASS |

**Gate J3 : PASS**

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-07*
