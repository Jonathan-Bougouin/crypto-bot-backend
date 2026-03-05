# MANIFESTS_EXEMPLE.md — COINBOT PRO PHASE 1.4

**Document** : Référence des manifests d'export Forward Test  
**Phase** : 1.4 — Forward Test 7 Jours  
**Date** : 2026-03-05  
**Statut** : LIVRABLE J1

---

## 1. Structure du Manifest

Chaque jour du forward test produit un fichier `manifest.json` dans le répertoire :

```
exports/forwardtest/{YYYY-MM-DD}/manifest.json
```

Le manifest est le **document de référence officiel** pour l'intégrité et la traçabilité de chaque journée de test. Il contient les checksums SHA256 de tous les fichiers d'export, les métadonnées de la session, et les statistiques de trading.

---

## 2. Manifest J1 — 2026-03-05 (RÉEL)

```json
{
  "version": "1.0",
  "phase": "1.4",
  "day": "J1",
  "date": "2026-03-05",
  "generatedAt": "2026-03-05T09:42:51.322806Z",
  "observationMode": true,
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
    "equitySnapshots": 24,
    "topRejectReasons": {}
  },
  "files": {
    "decisions.jsonl": {
      "exists": true,
      "sizeBytes": 56920,
      "sha256": "ed577894be9de8be1f57c5b03bd14c1e4511cd900e08b51fb072bbce451cb819",
      "recordCount": 120
    },
    "signals.jsonl": {
      "exists": true,
      "sizeBytes": 76324,
      "sha256": "215046f08150d6cbbbf4c780dcd4b25133bfdce4d83919c4f18d9ddb6e12de58",
      "recordCount": 360
    },
    "equity.csv.jsonl": {
      "exists": true,
      "sizeBytes": 5208,
      "sha256": "03e17908a15b969f162a0090c4a328fc6e40347f06fbee2ef650d43c2b8aa66e",
      "recordCount": 24
    }
  }
}
```

---

## 3. Schéma des Fichiers d'Export

### 3.1 `decisions.jsonl` — Décisions de Trading

Format NDJSON (une décision par ligne). Chaque enregistrement contient :

| Champ | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Horodatage UTC de la décision |
| `userId` | string | Identifiant de l'utilisateur / session |
| `asset` | string | Paire de trading (ex: `BTC-EUR`) |
| `action` | enum | `BUY` / `SELL` / `HOLD` / `REJECT` |
| `confidence` | float [0,1] | Score de confiance du signal |
| `price` | float | Prix de marché au moment de la décision |
| `quantity` | float | Quantité calculée (0 si HOLD/REJECT) |
| `reason` | string | Justification textuelle de la décision |
| `rejectReason` | string? | Code de rejet (null si non REJECT) |
| `portfolioValueBefore` | float | Valeur du portefeuille avant décision |
| `portfolioValueAfter` | float | Valeur du portefeuille après décision |
| `indicators` | object | Indicateurs techniques utilisés |
| `observationMode` | boolean | `true` = pas d'exécution réelle |

**Exemple d'enregistrement BUY :**

```json
{
  "timestamp": "2026-03-05T09:00:00Z",
  "userId": "system_forwardtest",
  "asset": "BNB-EUR",
  "action": "BUY",
  "confidence": 0.5,
  "price": 519.615,
  "quantity": 0.01924502,
  "reason": "RSI oversold (24.4), MACD positive, EMA bullish cross",
  "rejectReason": null,
  "portfolioValueBefore": 50.0,
  "portfolioValueAfter": 50.0,
  "indicators": {
    "rsi": 24.44,
    "macd": 1.234567,
    "ema20": 518.9,
    "ema50": 517.2,
    "volume24h": 1234567.89,
    "priceChange24h": -1.23
  },
  "observationMode": true
}
```

### 3.2 `signals.jsonl` — Signaux Techniques

Format NDJSON. Chaque enregistrement représente un signal technique calculé :

| Champ | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Horodatage UTC |
| `userId` | string | Identifiant de session |
| `asset` | string | Paire de trading |
| `signalType` | string | `RSI` / `MACD` / `EMA_CROSS` |
| `value` | float | Valeur calculée du signal |
| `threshold` | float? | Seuil de déclenchement |
| `triggered` | boolean | `true` si le signal est actif |
| `timeframe` | string? | Période d'analyse (`1h`, `4h`) |
| `observationMode` | boolean | Mode observation |

**Exemple :**

```json
{
  "timestamp": "2026-03-05T09:00:00Z",
  "userId": "system_forwardtest",
  "asset": "BNB-EUR",
  "signalType": "RSI",
  "value": 24.44,
  "threshold": 30,
  "triggered": true,
  "timeframe": "1h",
  "observationMode": true
}
```

### 3.3 `equity.csv.jsonl` — Historique d'Equity

Format NDJSON (convertible en CSV via `/api/exports/equity-csv`). Un snapshot par heure :

| Champ | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | Horodatage UTC |
| `userId` | string | Identifiant de session |
| `cashBalance` | float | Solde cash disponible (EUR) |
| `positionsValue` | float | Valeur mark-to-market des positions |
| `totalEquity` | float | Equity totale = cash + positions |
| `openPositions` | int | Nombre de positions ouvertes |
| `dailyPnL` | float | PnL de la journée |
| `cumulativePnL` | float | PnL cumulé depuis le début |
| `observationMode` | boolean | Mode observation |

---

## 4. Endpoints d'Export (API)

Les exports sont accessibles via les endpoints Express suivants (admin-only) :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/exports/trades-jsonl` | GET | Stream NDJSON des décisions |
| `/api/exports/signals-jsonl` | GET | Stream NDJSON des signaux |
| `/api/exports/equity-csv` | GET | Stream CSV de l'equity |
| `/api/exports/manifest` | GET | Manifest JSON avec checksums |
| `/api/exports/dates` | GET | Liste des dates disponibles |

**Paramètre commun** : `?date=YYYY-MM-DD` (défaut : date la plus récente)

**Headers de réponse** :
- `X-Export-Date` : date de l'export
- `X-SHA256` : checksum SHA256 du fichier
- `X-Record-Count` : nombre d'enregistrements
- `X-File-Size` : taille en octets

---

## 5. Procédure de Vérification d'Intégrité

Pour vérifier l'intégrité d'un fichier d'export :

```bash
# Vérifier le SHA256 d'un fichier
sha256sum exports/forwardtest/2026-03-05/decisions.jsonl
# Attendu : ed577894be9de8be1f57c5b03bd14c1e4511cd900e08b51fb072bbce451cb819

sha256sum exports/forwardtest/2026-03-05/signals.jsonl
# Attendu : 215046f08150d6cbbbf4c780dcd4b25133bfdce4d83919c4f18d9ddb6e12de58

sha256sum exports/forwardtest/2026-03-05/equity.csv.jsonl
# Attendu : 03e17908a15b969f162a0090c4a328fc6e40347f06fbee2ef650d43c2b8aa66e
```

---

## 6. Procédure J2–J7

Pour chaque jour suivant, exécuter :

```bash
# Mettre à jour la date dans forwardtest_j{N}.py
OBSERVATION_MODE=true python3 server/forwardtest_j1.py

# Vérifier le manifest généré
cat exports/forwardtest/{YYYY-MM-DD}/manifest.json

# Vérifier les checksums
sha256sum exports/forwardtest/{YYYY-MM-DD}/*.jsonl
```

Les manifests quotidiens sont conservés dans `exports/forwardtest/{YYYY-MM-DD}/manifest.json` et constituent la **preuve d'intégrité** du forward test.

---

*Document généré par COINBOT PRO — PHASE 1.4 — 2026-03-05*
