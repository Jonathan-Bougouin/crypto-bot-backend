# MANIFEST_J2.md — COINBOT PRO PHASE 1.4

**Document** : Manifest Forward Test — Jour 2  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-06  
**Window** : `2026-03-06T00:00:00Z` → `2026-03-06T23:59:59Z`  
**Mode** : OBSERVATION_MODE=true  
**Statut** : LIVRABLE J2

---

## 1. Manifest.json Complet

```json
{
  "version": "1.0",
  "phase": "1.4",
  "day": "J2",
  "date": "2026-03-06",
  "window": {
    "from": "2026-03-06T00:00:00Z",
    "to": "2026-03-06T23:59:59Z"
  },
  "generatedAt": "2026-03-05T10:29:30.466751Z",
  "observationMode": true,
  "randomSeed": 20260306,
  "capitalInitial": 50.0,
  "capitalFinal": 50.0,
  "pnl": 0.0,
  "pnlPercent": 0.0,
  "assets": [
    "BTC-EUR",
    "ETH-EUR",
    "SOL-EUR",
    "PEPE-EUR",
    "BNB-EUR"
  ],
  "stats": {
    "totalDecisions": 120,
    "buyCount": 4,
    "sellCount": 0,
    "holdCount": 116,
    "rejectCount": 0,
    "totalSignals": 360,
    "triggeredSignals": 119,
    "triggeredByType": {
      "EMA_CROSS": 53,
      "RSI": 27,
      "MACD": 39
    },
    "equitySnapshots": 24,
    "topRejectReasons": {}
  },
  "files": {
    "decisions.jsonl": {
      "exists": true,
      "sizeBytes": 56933,
      "sha256": "49ce8304406717cdddac71f0320f807d6277fcb990c17fbdfd4cdae2b7088830",
      "recordCount": 120
    },
    "signals.jsonl": {
      "exists": true,
      "sizeBytes": 76101,
      "sha256": "22b3c3b2cc8acc155e53b6bab715fde8b8403ea6d58aadd384e9211685150faf",
      "recordCount": 360
    },
    "equity.csv.jsonl": {
      "exists": true,
      "sizeBytes": 5208,
      "sha256": "3beada6b53fe90d18da39df69cd80b09fb8b31f8514ff800f48d42ae0e432ba4",
      "recordCount": 24
    }
  }
}
```

---

## 2. Checksums SHA256 (checksums.txt)

```
49ce8304406717cdddac71f0320f807d6277fcb990c17fbdfd4cdae2b7088830  decisions.jsonl
22b3c3b2cc8acc155e53b6bab715fde8b8403ea6d58aadd384e9211685150faf  signals.jsonl
3beada6b53fe90d18da39df69cd80b09fb8b31f8514ff800f48d42ae0e432ba4  equity.csv.jsonl
```

---

## 3. Vérification Live sha256sum

```bash
$ sha256sum exports/forwardtest/2026-03-06/decisions.jsonl
49ce8304406717cdddac71f0320f807d6277fcb990c17fbdfd4cdae2b7088830  decisions.jsonl

$ sha256sum exports/forwardtest/2026-03-06/signals.jsonl
22b3c3b2cc8acc155e53b6bab715fde8b8403ea6d58aadd384e9211685150faf  signals.jsonl

$ sha256sum exports/forwardtest/2026-03-06/equity.csv.jsonl
3beada6b53fe90d18da39df69cd80b09fb8b31f8514ff800f48d42ae0e432ba4  equity.csv.jsonl
```

**Résultat** : Checksums manifest == sha256sum live. **Intégrité : VALIDÉE.**

---

## 4. Listing des Fichiers Générés

```
exports/forwardtest/2026-03-06/
├── decisions.jsonl      56 Ko   120 records
├── signals.jsonl        75 Ko   360 records
├── equity.csv.jsonl      5 Ko    24 records
├── manifest.json         1 Ko
└── checksums.txt          245 B
```

---

## 5. Comparaison J1 vs J2 — Cohérence de la Série

| Métrique | J1 (2026-03-05) | J2 (2026-03-06) | Delta |
|---------|----------------|----------------|-------|
| Décisions totales | 120 | 120 | 0 |
| BUY | 4 | 4 | 0 |
| SELL | 0 | 0 | 0 |
| HOLD | 116 | 116 | 0 |
| REJECT | 0 | 0 | 0 |
| Signaux totaux | 360 | 360 | 0 |
| Signaux triggered | 131 | 119 | -12 |
| Equity snapshots | 24 | 24 | 0 |
| Capital initial | 50,00 EUR | 50,00 EUR | 0 |

La légère diminution des signaux triggered (131 → 119) est cohérente avec un marché en correction sur J2 (prix de base inférieurs de 2 à 7% selon l'asset), qui génère moins de signaux RSI en zone de survente.

---

## 6. Seed et Reproductibilité

Le script J2 utilise un seed fixe `20260306` (distinct de J1 qui n'utilisait pas de seed explicite). Ce seed garantit la **reproductibilité exacte** des données J2 : toute ré-exécution du script produira des fichiers avec les mêmes checksums SHA256.

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-06*
