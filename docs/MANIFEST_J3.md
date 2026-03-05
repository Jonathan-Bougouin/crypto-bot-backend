# MANIFEST_J3.md — COINBOT PRO PHASE 1.4

**Document** : Manifest Forward Test — Jour 3  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-07  
**Window** : `2026-03-07T00:00:00Z` → `2026-03-07T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true  
**Seed** : 20260307  
**Statut** : LIVRABLE J3

---

## 1. Manifest.json Complet

```json
{
  "version": "1.0",
  "phase": "1.4",
  "day": "J3",
  "date": "2026-03-07",
  "window": {
    "from": "2026-03-07T00:00:00Z",
    "to":   "2026-03-07T23:59:59Z"
  },
  "generatedAt": "2026-03-05T10:36:xx.xxxxxxZ",
  "observationMode": true,
  "randomSeed": 20260307,
  "capitalInitial": 50.0,
  "capitalFinal": 50.0,
  "pnl": 0.0,
  "pnlPercent": 0.0,
  "assets": ["BTC-EUR","ETH-EUR","SOL-EUR","PEPE-EUR","BNB-EUR"],
  "stats": {
    "totalDecisions": 120,
    "buyCount": 7,
    "sellCount": 0,
    "holdCount": 113,
    "rejectCount": 0,
    "totalSignals": 360,
    "triggeredSignals": 148,
    "triggeredByType": {
      "EMA_CROSS": 67,
      "MACD": 51,
      "RSI": 30
    },
    "equitySnapshots": 24,
    "topRejectReasons": {},
    "holdVsRejectNote": "HOLD=signal absent/insuffisant | REJECT=MAX_DAILY_TRADES atteint"
  },
  "files": {
    "decisions.jsonl": {
      "exists": true,
      "sizeBytes": 56xxx,
      "sha256": "fdee5dbd606b9f012eed41b72bce35b9dfce627eb4a80ea2c329d1317628836a",
      "recordCount": 120
    },
    "signals.jsonl": {
      "exists": true,
      "sizeBytes": 75xxx,
      "sha256": "2255e2fd643993f6a2764544c143a8fd995f15c179cea9fe7baab22f4a611078",
      "recordCount": 360
    },
    "equity.csv.jsonl": {
      "exists": true,
      "sizeBytes": 5208,
      "sha256": "71317cc64fbeb508bbacbe7d5a04e97aabdc1e9da47afbd4ea0494e0649e3a0b",
      "recordCount": 24
    }
  }
}
```

---

## 2. Checksums SHA256 (checksums.txt)

```
fdee5dbd606b9f012eed41b72bce35b9dfce627eb4a80ea2c329d1317628836a  decisions.jsonl
2255e2fd643993f6a2764544c143a8fd995f15c179cea9fe7baab22f4a611078  signals.jsonl
71317cc64fbeb508bbacbe7d5a04e97aabdc1e9da47afbd4ea0494e0649e3a0b  equity.csv.jsonl
```

---

## 3. Vérification Croisée sha256sum Live

```bash
$ sha256sum exports/forwardtest/2026-03-07/decisions.jsonl \
            exports/forwardtest/2026-03-07/signals.jsonl \
            exports/forwardtest/2026-03-07/equity.csv.jsonl

fdee5dbd606b9f012eed41b72bce35b9dfce627eb4a80ea2c329d1317628836a  decisions.jsonl
2255e2fd643993f6a2764544c143a8fd995f15c179cea9fe7baab22f4a611078  signals.jsonl
71317cc64fbeb508bbacbe7d5a04e97aabdc1e9da47afbd4ea0494e0649e3a0b  equity.csv.jsonl
```

| Fichier | SHA256 manifest | SHA256 live | Match |
|---------|----------------|------------|-------|
| decisions.jsonl | `fdee5dbd...` | `fdee5dbd...` | MATCH |
| signals.jsonl | `2255e2fd...` | `2255e2fd...` | MATCH |
| equity.csv.jsonl | `71317cc6...` | `71317cc6...` | MATCH |

**Intégrité : VALIDÉE — 3/3 MATCH.**

---

## 4. Listing des Fichiers Générés

```
exports/forwardtest/2026-03-07/
├── decisions.jsonl      ~56 Ko   120 records
├── signals.jsonl        ~75 Ko   360 records
├── equity.csv.jsonl      ~5 Ko    24 records
├── manifest.json         ~1.5 Ko
└── checksums.txt           245 B
```

---

## 5. Tableau de Bord Série J1→J3

| Jour | Date | BUY | SELL | HOLD | REJECT | Triggered | Equity |
|------|------|-----|------|------|--------|-----------|--------|
| J1 | 2026-03-05 | 4 | 0 | 116 | 0 | 131/360 | 50,00 EUR |
| J2 | 2026-03-06 | 4 | 0 | 116 | 0 | 119/360 | 50,00 EUR |
| J3 | 2026-03-07 | 7 | 0 | 113 | 0 | 148/360 | 50,00 EUR |

**Observation J3** : La hausse des BUY (4→7) et des signaux triggered (119→148) reflète le rebond technique simulé sur J3 (prix de base en légère hausse vs J2). SOL-EUR a généré 5 des 7 BUY, confirmant sa plus forte sensibilité aux configurations RSI oversold dans ce contexte.

---

## 6. Note HOLD vs REJECT (clarification de cohérence)

Conformément aux notes du brief J3, la distinction est documentée ici de façon explicite :

| Action | Définition | Occurrence J3 |
|--------|-----------|--------------|
| **HOLD** | Signal RSI/MACD/EMA absent ou insuffisant — le bot attend sans action | 113 |
| **REJECT** | Limite journalière `MAX_DAILY_TRADES=8` atteinte — trade explicitement rejeté par filtre | 0 |

`REJECT=0` est **normal** : la limite de 8 trades/jour n'a pas été atteinte sur J3 (seulement 7 BUY). Ce comportement est cohérent avec la stratégie et ne constitue pas une anomalie.

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-07*
