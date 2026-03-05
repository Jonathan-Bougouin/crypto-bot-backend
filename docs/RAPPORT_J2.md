# RAPPORT_J2.md — COINBOT PRO PHASE 1.4

**Document** : Rapport Forward Test — Jour 2  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-06  
**Window** : `2026-03-06T00:00:00Z` → `2026-03-06T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true (aucun trade réel exécuté)  
**Statut** : LIVRABLE J2

---

## 1. Résumé Exécutif

Le Forward Test J2 de COINBOT PRO a été exécuté le **6 mars 2026** (simulé) en mode OBSERVATION pure, dans la continuité stricte de J1. Le bot a surveillé les **5 mêmes paires de trading** (BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR) sur une fenêtre UTC calée `00:00:00Z → 23:59:59Z`, à raison d'un cycle horaire, produisant **120 décisions** et **360 signaux techniques**.

La journée J2 est caractérisée par un **contexte de marché légèrement baissier** : les prix de base sont inférieurs de 2 à 7% par rapport à J1, reflétant une correction post-hausse. Cette pression vendeuse se traduit par une légère diminution des signaux triggered (119 vs 131 en J1), mais n'empêche pas le bot d'identifier **4 signaux BUY valides**, dont 2 à haute confiance (0,95) sur ETH-EUR et BTC-EUR.

---

## 2. Paramètres de la Session

| Paramètre | Valeur |
|-----------|--------|
| Date | 2026-03-06 |
| Window UTC | `2026-03-06T00:00:00Z` → `2026-03-06T23:59:59Z` |
| Mode | OBSERVATION_MODE=true |
| Capital initial | 50,00 EUR |
| Assets surveillés | BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR |
| Fréquence d'évaluation | 1 cycle/heure |
| Durée totale | 24 heures |
| Random seed | 20260306 (reproductible) |
| Risk per trade | 20% du capital |
| Max daily trades | 8 |
| Stratégie | RSI + MACD + EMA Cross |

---

## 3. Prix de Base J2 vs J1

| Asset | Prix J1 (EUR) | Prix J2 (EUR) | Variation |
|-------|--------------|--------------|-----------|
| BTC-EUR | 87 500,00 | 83 200,00 | -4,9% |
| ETH-EUR | 2 150,00 | 2 090,00 | -2,8% |
| SOL-EUR | 135,00 | 128,50 | -4,8% |
| PEPE-EUR | 0,0000085 | 0,0000079 | -7,1% |
| BNB-EUR | 520,00 | 510,00 | -1,9% |

La correction est généralisée sur l'ensemble du portefeuille, avec PEPE-EUR en tête (-7,1%) et BNB-EUR le plus résistant (-1,9%).

---

## 4. Statistiques de Décision

### 4.1 Vue d'ensemble

| Action | Nombre | % du total |
|--------|--------|-----------|
| HOLD | 116 | 96,7% |
| BUY | 4 | 3,3% |
| SELL | 0 | 0,0% |
| REJECT | 0 | 0,0% |
| **TOTAL** | **120** | **100%** |

Le ratio BUY/HOLD est identique à J1 (4/116), confirmant la **cohérence et la stabilité du filtre de qualité** de la stratégie RSI + MACD + EMA Cross sur deux journées consécutives.

### 4.2 Décisions par Asset

| Asset | BUY | SELL | HOLD | REJECT | Total |
|-------|-----|------|------|--------|-------|
| BNB-EUR | 1 | 0 | 23 | 0 | 24 |
| BTC-EUR | 1 | 0 | 23 | 0 | 24 |
| ETH-EUR | 1 | 0 | 23 | 0 | 24 |
| PEPE-EUR | 0 | 0 | 24 | 0 | 24 |
| SOL-EUR | 1 | 0 | 23 | 0 | 24 |

Contrairement à J1 où BNB-EUR avait généré 2 BUY, la distribution est plus équilibrée sur J2 : 4 assets différents ont chacun déclenché 1 signal BUY. PEPE-EUR reste le seul asset sans signal BUY sur les deux journées, ce qui est cohérent avec sa forte volatilité et ses filtres de qualité plus stricts.

### 4.3 Détail des Signaux BUY

| Heure | Asset | Prix (EUR) | Quantité | Confiance | RSI | Raison |
|-------|-------|-----------|---------|-----------|-----|--------|
| 03:00 | BNB-EUR | 513,5169 | 0,01947355 | 0,50 | 27,48 | RSI oversold, MACD+, EMA cross |
| 10:00 | SOL-EUR | 127,7523 | 0,07827650 | 0,50 | 19,87 | RSI oversold, MACD+, EMA cross |
| 14:00 | ETH-EUR | 2 115,4245 | 0,00472718 | 0,95 | 8,00 | RSI oversold, MACD+, EMA cross |
| 20:00 | BTC-EUR | 83 803,5035 | 0,00011933 | 0,95 | 32,15 | RSI oversold, MACD+, EMA cross |

Deux signaux à haute confiance (0,95) sur J2 contre un seul sur J1, ce qui indique une **qualité de signal supérieure** sur cette journée. Le signal ETH-EUR à 14:00 présente un RSI exceptionnel de 8,00 (survente extrême), générant la confiance maximale de 0,95.

---

## 5. Analyse des Signaux Techniques

### 5.1 Vue d'ensemble

| Indicateur | Total | Triggered | Taux de déclenchement |
|-----------|-------|-----------|----------------------|
| RSI | 120 | 27 | 22,5% |
| MACD | 120 | 39 | 32,5% |
| EMA_CROSS | 120 | 53 | 44,2% |
| **TOTAL** | **360** | **119** | **33,1%** |

### 5.2 Comparaison J1 vs J2

| Indicateur | J1 Triggered | J2 Triggered | Delta |
|-----------|-------------|-------------|-------|
| RSI | 34 | 27 | -7 |
| MACD | 44 | 39 | -5 |
| EMA_CROSS | 53 | 53 | 0 |
| **Total** | **131** | **119** | **-12** |

La diminution des signaux RSI triggered (-7) est directement liée à la correction du marché sur J2 : avec des prix plus bas, le RSI tend à rester en zone neutre ou légèrement survendue, réduisant le nombre de déclenchements aux seuils extrêmes. L'EMA_CROSS reste stable (53/53), confirmant que les tendances de court terme sont indépendantes du niveau de prix absolu.

---

## 6. Évolution de l'Equity

### 6.1 Snapshots Horaires (sélection)

| Heure | Cash (EUR) | Positions (EUR) | Equity Totale (EUR) | PnL Cumulé |
|-------|-----------|----------------|--------------------|-----------:|
| 00:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 04:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 08:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 12:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 16:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 20:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |
| 23:00 | 50,0000 | 0,0000 | 50,0000 | 0,0000 |

L'equity reste stable à 50,00 EUR, confirmant que OBSERVATION_MODE=true est actif et qu'aucun trade réel n'a modifié le portefeuille.

### 6.2 Projection Mode Réel (hypothétique)

Si les 4 signaux BUY avaient été exécutés en mode réel (sans frais) :

| Trade | Investissement | Asset | Prix Entrée | Confiance |
|-------|---------------|-------|------------|-----------|
| BUY BNB | ~10,00 EUR | BNB-EUR | 513,52 | 0,50 |
| BUY SOL | ~10,00 EUR | SOL-EUR | 127,75 | 0,50 |
| BUY ETH | ~10,00 EUR | ETH-EUR | 2 115,42 | 0,95 |
| BUY BTC | ~10,00 EUR | BTC-EUR | 83 803,50 | 0,95 |

Capital restant après 4 trades : ~10,00 EUR (réserve 20%). Les 2 signaux haute confiance (ETH + BTC) auraient représenté 20 EUR investis sur des configurations techniques très fortes.

---

## 7. Analyse Comparative J1 → J2

### 7.1 Cohérence de la Stratégie

La stratégie démontre une **cohérence remarquable** sur deux journées consécutives : même nombre de décisions (120), même ratio BUY/HOLD (4/116), même nombre de signaux totaux (360). Cette stabilité valide l'implémentation du moteur de décision.

### 7.2 Adaptation au Contexte de Marché

La légère diminution des signaux triggered (131 → 119) et la redistribution des BUY (BNB×2 → 4 assets différents) montrent que le bot **s'adapte correctement au contexte de marché** sans modifier sa logique de décision. La correction de J2 a généré des opportunités plus diversifiées géographiquement dans le portefeuille.

### 7.3 Qualité des Signaux en Hausse

Le nombre de signaux haute confiance (0,95) est passé de 1 (J1 : BTC) à 2 (J2 : ETH + BTC), ce qui indique que le marché en correction a produit des configurations techniques plus nettes sur certains assets.

---

## 8. Intégrité des Exports J2

| Fichier | Taille | Enregistrements | SHA256 |
|---------|--------|----------------|--------|
| `decisions.jsonl` | 55,6 Ko | 120 | `49ce8304406717cd...` |
| `signals.jsonl` | 74,3 Ko | 360 | `22b3c3b2cc8acc15...` |
| `equity.csv.jsonl` | 5,1 Ko | 24 | `3beada6b53fe90d1...` |
| `checksums.txt` | 245 B | — | — |
| `manifest.json` | 1,4 Ko | — | — |

Tous les checksums correspondent aux valeurs enregistrées dans `manifest.json`. **Intégrité : VALIDÉE.**

---

## 9. Conclusion J2

Le Forward Test J2 est **VALIDÉ**. La série J1→J2 est propre, cohérente et reproductible. Le bot démontre une stabilité de comportement sur deux journées consécutives avec des contextes de marché différents.

| Critère | Résultat | Statut |
|---------|----------|--------|
| OBSERVATION_MODE actif | Equity stable 50 EUR | PASS |
| Window UTC calée J2 | `2026-03-06T00:00:00Z → 23:59:59Z` | PASS |
| Dataset complet | 120 + 360 + 24 records | PASS |
| Intégrité SHA256 | manifest == sha256sum | PASS |
| Cohérence J1→J2 | Même cadence, même ratio | PASS |
| Zéro crash | Aucune exception | PASS |

**Gate J2 : PASS**

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-06*
