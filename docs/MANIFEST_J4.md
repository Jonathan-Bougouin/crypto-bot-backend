# MANIFEST_J4.md — COINBOT PRO PHASE 1.4

**Document** : Manifest Forward Test — Jour 4  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-08  
**Window** : `2026-03-08T00:00:00Z` → `2026-03-08T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true  
**Seed** : 20260308  
**Contexte marché** : Consolidation post-rebond J3  
**Statut** : LIVRABLE J4

---

## 1. Manifest.json Complet

```json
{
  "version": "1.0",
  "phase": "1.4",
  "day": "J4",
  "date": "2026-03-08",
  "window": {
    "from": "2026-03-08T00:00:00Z",
    "to":   "2026-03-08T23:59:59Z"
  },
  "observationMode": true,
  "randomSeed": 20260308,
  "capitalInitial": 50.0,
  "capitalFinal": 50.0,
  "pnl": 0.0,
  "pnlPercent": 0.0,
  "assets": ["BTC-EUR","ETH-EUR","SOL-EUR","PEPE-EUR","BNB-EUR"],
  "marketContext": "Consolidation post-rebond J3 — BTC/ETH légère pression, SOL continuation",
  "stats": {
    "totalDecisions": 120,
    "buyCount": 2,
    "sellCount": 0,
    "holdCount": 118,
    "rejectCount": 0,
    "totalSignals": 360,
    "triggeredSignals": 121,
    "triggeredByType": {
      "EMA_CROSS": 51,
      "MACD": 50,
      "RSI": 20
    },
    "equitySnapshots": 24,
    "topRejectReasons": {},
    "holdVsRejectNote": "HOLD=signal absent/insuffisant | REJECT=MAX_DAILY_TRADES atteint"
  },
  "files": {
    "decisions.jsonl": {
      "exists": true,
      "sha256": "6e971454912ad78b6198855b1cd09da4f974f41162a4331ad56570ec6dd1e72d",
      "recordCount": 120
    },
    "signals.jsonl": {
      "exists": true,
      "sha256": "852355ccfec718737496373dfa09d5a99ad9a61a094c1a8c4c31e46a51b6b24c",
      "recordCount": 360
    },
    "equity.csv.jsonl": {
      "exists": true,
      "sha256": "97ee98fa44afb780b8eae212a6e401586861dc088cf9d6635370b761e7ad82f5",
      "recordCount": 24
    }
  }
}
```

---

## 2. Checksums SHA256 (checksums.txt)

```
6e971454912ad78b6198855b1cd09da4f974f41162a4331ad56570ec6dd1e72d  decisions.jsonl
852355ccfec718737496373dfa09d5a99ad9a61a094c1a8c4c31e46a51b6b24c  signals.jsonl
97ee98fa44afb780b8eae212a6e401586861dc088cf9d6635370b761e7ad82f5  equity.csv.jsonl
```

---

## 3. Vérification Croisée sha256sum Live

| Fichier | SHA256 manifest | SHA256 live | Match |
|---------|----------------|------------|-------|
| decisions.jsonl | `6e971454...` | `6e971454...` | MATCH |
| signals.jsonl | `852355cc...` | `852355cc...` | MATCH |
| equity.csv.jsonl | `97ee98fa...` | `97ee98fa...` | MATCH |

**Intégrité : VALIDÉE — 3/3 MATCH.**

---

## 4. Listing des Fichiers Générés

```
exports/forwardtest/2026-03-08/
├── decisions.jsonl      ~56 Ko   120 records
├── signals.jsonl        ~75 Ko   360 records
├── equity.csv.jsonl      ~5 Ko    24 records
├── manifest.json         ~1.6 Ko
└── checksums.txt           245 B
```

---

## 5. Tableau de Bord Série J1→J4

| Jour | Date | BUY | SELL | HOLD | REJECT | Triggered | Contexte |
|------|------|-----|------|------|--------|-----------|---------|
| J1 | 2026-03-05 | 4 | 0 | 116 | 0 | 131/360 | Baseline |
| J2 | 2026-03-06 | 4 | 0 | 116 | 0 | 119/360 | Légère correction |
| J3 | 2026-03-07 | 7 | 0 | 113 | 0 | 148/360 | Rebond technique |
| J4 | 2026-03-08 | 2 | 0 | 118 | 0 | 121/360 | Consolidation |

**Observation J4** : La baisse des BUY (7→2) et des signaux triggered (148→121) est cohérente avec le contexte de consolidation post-rebond. Le RSI se recentralise (~50), le MACD devient légèrement négatif, réduisant les configurations BUY. Les 2 BUY sont concentrés sur BTC-EUR en milieu de journée (11h et 13h), sur des configurations RSI oversold ponctuelles.

---

## 6. Note HOLD vs REJECT (maintenu J4)

| Action | Définition | Occurrence J4 |
|--------|-----------|--------------|
| **HOLD** | Signal RSI/MACD/EMA absent ou insuffisant — bot attend | 118 |
| **REJECT** | Limite `MAX_DAILY_TRADES=8` atteinte — trade bloqué | 0 |

`REJECT=0` est normal : 2 BUY << 8 limite. Comportement cohérent avec la stratégie.

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-08*
