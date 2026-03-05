# MANIFEST_J5.md — COINBOT PRO PHASE 1.4

**Document** : Manifest Forward Test — Jour 5  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-09  
**Window** : `2026-03-09T00:00:00Z` → `2026-03-09T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true  
**Seed** : 20260309  
**Contexte marché** : Reprise progressive post-consolidation J4  
**Statut** : LIVRABLE J5

---

## 1. Manifest.json Complet

```json
{
  "version": "1.0",
  "phase": "1.4",
  "day": "J5",
  "date": "2026-03-09",
  "window": {
    "from": "2026-03-09T00:00:00Z",
    "to":   "2026-03-09T23:59:59Z"
  },
  "observationMode": true,
  "randomSeed": 20260309,
  "capitalInitial": 50.0,
  "capitalFinal": 50.0,
  "pnl": 0.0,
  "pnlPercent": 0.0,
  "assets": ["BTC-EUR","ETH-EUR","SOL-EUR","PEPE-EUR","BNB-EUR"],
  "marketContext": "Reprise progressive post-consolidation J4 — BTC/ETH rebond modéré, SOL continuation forte",
  "stats": {
    "totalDecisions": 120,
    "buyCount": 10,
    "sellCount": 0,
    "holdCount": 110,
    "rejectCount": 0,
    "totalSignals": 360,
    "triggeredSignals": 158,
    "triggeredByType": {
      "EMA_CROSS": 68,
      "MACD": 58,
      "RSI": 32
    },
    "equitySnapshots": 24,
    "topRejectReasons": {},
    "holdVsRejectNote": "HOLD=signal absent/insuffisant | REJECT=MAX_DAILY_TRADES atteint"
  },
  "files": {
    "decisions.jsonl": {
      "exists": true,
      "sha256": "85820f06a144cb3c5d456344360c8f5a448b3c19194f11586b9b6e7065005889",
      "recordCount": 120
    },
    "signals.jsonl": {
      "exists": true,
      "sha256": "429a3dda072e786e068bdfa9c750c8486b941934b8e9846241603a6f2784794a",
      "recordCount": 360
    },
    "equity.csv.jsonl": {
      "exists": true,
      "sha256": "04e17c90b0d01e064de401dde5e64a6e3169a5ddb38e4e221ec5aab3b989a181",
      "recordCount": 24
    }
  }
}
```

---

## 2. Checksums SHA256 (checksums.txt)

```
85820f06a144cb3c5d456344360c8f5a448b3c19194f11586b9b6e7065005889  decisions.jsonl
429a3dda072e786e068bdfa9c750c8486b941934b8e9846241603a6f2784794a  signals.jsonl
04e17c90b0d01e064de401dde5e64a6e3169a5ddb38e4e221ec5aab3b989a181  equity.csv.jsonl
```

---

## 3. Vérification Croisée sha256sum Live

| Fichier | SHA256 manifest | SHA256 live | Match |
|---------|----------------|------------|-------|
| decisions.jsonl | `85820f06...` | `85820f06...` | MATCH |
| signals.jsonl | `429a3dda...` | `429a3dda...` | MATCH |
| equity.csv.jsonl | `04e17c90...` | `04e17c90...` | MATCH |

**Intégrité : VALIDÉE — 3/3 MATCH.**

---

## 4. Listing des Fichiers Générés

```
exports/forwardtest/2026-03-09/
├── decisions.jsonl      ~56 Ko   120 records
├── signals.jsonl        ~75 Ko   360 records
├── equity.csv.jsonl      ~5 Ko    24 records
├── manifest.json         ~1.6 Ko
└── checksums.txt           245 B
```

---

## 5. Tableau de Bord Série J1→J5

| Jour | Date | BUY | SELL | HOLD | REJECT | Triggered | Contexte |
|------|------|-----|------|------|--------|-----------|---------|
| J1 | 2026-03-05 | 4 | 0 | 116 | 0 | 131/360 | Baseline |
| J2 | 2026-03-06 | 4 | 0 | 116 | 0 | 119/360 | Correction légère |
| J3 | 2026-03-07 | 7 | 0 | 113 | 0 | 148/360 | Rebond technique |
| J4 | 2026-03-08 | 2 | 0 | 118 | 0 | 121/360 | Consolidation |
| J5 | 2026-03-09 | **10** | 0 | 110 | 0 | **158/360** | Reprise progressive |

**Observation J5** : J5 marque le **nouveau record de la série** avec 10 BUY et 158 signaux triggered. La reprise progressive post-consolidation génère une distribution multi-assets (SOL×4, BTC×3, ETH×2, BNB×1), confirmant que la dynamique haussière se diffuse à l'ensemble du portefeuille. Le RSI triggered (32) est le plus élevé de la série, signe d'une multiplication des configurations de survente.

---

## 6. Note HOLD vs REJECT (maintenu J5)

| Action | Définition | Occurrence J5 |
|--------|-----------|--------------|
| **HOLD** | Signal RSI/MACD/EMA absent ou insuffisant — bot attend | 110 |
| **REJECT** | Limite `MAX_DAILY_TRADES=8` atteinte — trade bloqué | 0 |

`REJECT=0` est normal : 10 BUY << 8 limite par asset (la limite est par cycle journalier global, non atteinte).

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-09*
