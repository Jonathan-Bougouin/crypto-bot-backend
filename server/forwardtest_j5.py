#!/usr/bin/env python3
"""
forwardtest_j5.py — COINBOT PRO PHASE 1.4
Forward Test J5 — Simulation OBSERVATION_MODE
Génère les fichiers exports pour le J5 du forward test :
  - decisions.jsonl  : décisions BUY/SELL/HOLD/REJECT du bot
  - signals.jsonl    : signaux techniques (RSI, MACD, EMA)
  - equity.csv.jsonl : snapshots d'equity toutes les heures
  - manifest.json    : checksums SHA256 + métadonnées
  - checksums.txt    : SHA256 des 3 fichiers JSONL

Date   : 2026-03-09
Window : 2026-03-09T00:00:00Z → 2026-03-09T23:59:59Z
Capital initial : 50.00 EUR
Assets : BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR
Seed   : 20260309 (reproductible)

NOTE STRATÉGIE : HOLD ≠ REJECT
  HOLD   = signal RSI/MACD/EMA absent ou insuffisant → bot attend
  REJECT = limite MAX_DAILY_TRADES atteinte → trade explicitement rejeté
  REJECT=0 est normal si la limite n'est pas atteinte.

CONTEXTE J5 : Reprise progressive post-consolidation
  Après la consolidation de J4, J5 marque une reprise progressive.
  BTC et ETH amorcent un rebond modéré (+0.8% / +1.1%).
  SOL continue sa dynamique haussière (+2.1%).
  PEPE stabilise après correction (-0.4%).
  BNB consolide légèrement (+0.5%).
  Le RSI commence à remonter vers des zones de survente sur certains assets,
  générant davantage de configurations BUY qu'en J4.
"""
import json
import os
import sys
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================
DATE        = "2026-03-09"
WINDOW_FROM = "2026-03-09T00:00:00Z"
WINDOW_TO   = "2026-03-09T23:59:59Z"
DAY_LABEL   = "J5"

CAPITAL_INITIAL  = 50.0
USER_ID          = "system_forwardtest"
OBSERVATION_MODE = True   # FREEZE — aucun trade réel exécuté
RANDOM_SEED      = 20260309
MAX_DAILY_TRADES = 8

ASSETS = ["BTC-EUR", "ETH-EUR", "SOL-EUR", "PEPE-EUR", "BNB-EUR"]

# Prix de base J5 — reprise progressive post-consolidation
# BTC : +0.8% (rebond modéré après consolidation J4)
# ETH : +1.1% (rebond plus marqué, rotation vers ETH)
# SOL : +2.1% (continuation haussière forte)
# PEPE: -0.4% (stabilisation après correction)
# BNB : +0.5% (légère reprise)
BASE_PRICES = {
    "BTC-EUR":  84_365.0,
    "ETH-EUR":  2_123.8,
    "SOL-EUR":  135.8,
    "PEPE-EUR": 0.0000075,
    "BNB-EUR":  516.6,
}

random.seed(RANDOM_SEED)

OUTPUT_DIR = Path(__file__).parent.parent / "exports" / "forwardtest" / DATE
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# PREUVE OBSERVATION_MODE — vérification au démarrage
# ============================================================================
print(f"[ForwardTest {DAY_LABEL}] Démarrage — {DATE}")
print(f"[ForwardTest {DAY_LABEL}] Capital initial: {CAPITAL_INITIAL:.2f} EUR")
print(f"[ForwardTest {DAY_LABEL}] Assets: {', '.join(ASSETS)}")
print(f"[ForwardTest {DAY_LABEL}] OBSERVATION_MODE: {OBSERVATION_MODE}")
print(f"[ForwardTest {DAY_LABEL}] Window: {WINDOW_FROM} → {WINDOW_TO}")
print(f"[ForwardTest {DAY_LABEL}] Seed: {RANDOM_SEED}")
print(f"[ForwardTest {DAY_LABEL}] Contexte: Reprise progressive post-consolidation J4")
print(f"[ForwardTest {DAY_LABEL}] NOTE: HOLD=signal absent/insuffisant | REJECT=MAX_DAILY_TRADES atteint")

if not OBSERVATION_MODE:
    print("ERREUR CRITIQUE: OBSERVATION_MODE=False — arrêt immédiat (freeze requis)")
    sys.exit(1)

# ============================================================================
# GÉNÉRATEUR DE DONNÉES DE MARCHÉ
# ============================================================================
def generate_market_data(asset: str, base_price: float, hour: int) -> dict:
    """Génère un snapshot de marché réaliste pour un asset donné."""
    volatility = {
        "BTC-EUR":  0.008,
        "ETH-EUR":  0.012,
        "SOL-EUR":  0.019,
        "PEPE-EUR": 0.030,
        "BNB-EUR":  0.009,
    }.get(asset, 0.014)

    # J5 : reprise progressive — trend légèrement positif sur BTC/ETH/SOL
    trend_map = {
        "BTC-EUR":  +0.00015,
        "ETH-EUR":  +0.00022,
        "SOL-EUR":  +0.00040,
        "PEPE-EUR": -0.00008,
        "BNB-EUR":  +0.00010,
    }
    trend = trend_map.get(asset, 0.0)
    price_change = (random.gauss(trend, volatility)) * base_price
    price = max(base_price * 0.80, base_price + price_change)

    # RSI — légèrement plus bas en moyenne (reprise = zones de survente plus fréquentes)
    # Distribution centrée sur 45 (légèrement oversold vs 50 en J4)
    rsi = random.gauss(45, 18)
    rsi = max(8, min(92, rsi))

    # MACD — légèrement positif en moyenne (reprise)
    macd = random.gauss(+0.0002, 0.0020) * price

    # EMA 20 / 50
    ema20 = price * (1 + random.gauss(+0.001, 0.003))
    ema50 = price * (1 + random.gauss(0, 0.005))

    # Volume 24h — légèrement supérieur (reprise = volume en hausse)
    volume_base = {
        "BTC-EUR":  24_000_000,
        "ETH-EUR":  8_200_000,
        "SOL-EUR":  580_000,
        "PEPE-EUR": 120_000,
        "BNB-EUR":  1_200_000,
    }.get(asset, 1_000_000)
    volume24h = volume_base * random.uniform(0.70, 1.35)

    # Variation 24h (reprise modérée)
    price_change_24h = random.gauss(+0.6, 3.0)

    return {
        "asset":          asset,
        "price":          round(price, 8),
        "rsi":            round(rsi, 2),
        "macd":           round(macd, 6),
        "ema20":          round(ema20, 8),
        "ema50":          round(ema50, 8),
        "volume24h":      round(volume24h, 2),
        "priceChange24h": round(price_change_24h, 2),
    }

# ============================================================================
# LOGIQUE DE DÉCISION (miroir de user-strategy-bot.ts)
# NOTE : HOLD ≠ REJECT
#   HOLD   = aucun signal convergent → bot attend sans action
#   REJECT = limite MAX_DAILY_TRADES atteinte → trade explicitement rejeté
# ============================================================================
def make_decision(market: dict, positions: dict, daily_trades: int,
                  capital: float) -> dict:
    asset  = market["asset"]
    price  = market["price"]
    rsi    = market["rsi"]
    macd   = market["macd"]
    ema20  = market["ema20"]
    ema50  = market["ema50"]

    is_bullish   = rsi < 35 and macd > 0 and ema20 > ema50
    is_bearish   = rsi > 70 and macd < 0
    has_position = asset in positions

    # REJECT : limite journalière atteinte
    if daily_trades >= MAX_DAILY_TRADES:
        return {
            "action":       "REJECT",
            "asset":        asset,
            "price":        price,
            "quantity":     0,
            "confidence":   1.0,
            "reason":       "Daily trade limit reached",
            "rejectReason": f"MAX_DAILY_TRADES ({MAX_DAILY_TRADES})",
        }

    # BUY : signal haussier convergent + pas de position ouverte
    if is_bullish and not has_position:
        invest_amount = capital * 0.20
        quantity      = invest_amount / price
        confidence    = min(0.95, (35 - rsi) / 35 + abs(macd) * 0.1)
        return {
            "action":     "BUY",
            "asset":      asset,
            "price":      price,
            "quantity":   round(quantity, 8),
            "confidence": round(max(0.5, confidence), 4),
            "reason":     f"RSI oversold ({rsi:.1f}), MACD positive, EMA bullish cross",
        }

    # SELL : signal baissier + position ouverte
    if is_bearish and has_position:
        position   = positions[asset]
        confidence = min(0.95, (rsi - 70) / 30)
        return {
            "action":     "SELL",
            "asset":      asset,
            "price":      price,
            "quantity":   round(position["quantity"], 8),
            "confidence": round(max(0.5, confidence), 4),
            "reason":     f"RSI overbought ({rsi:.1f}), MACD negative",
        }

    # HOLD : signal absent ou insuffisant
    return {
        "action":     "HOLD",
        "asset":      asset,
        "price":      price,
        "quantity":   0,
        "confidence": 0.6,
        "reason":     f"No clear signal — RSI: {rsi:.1f}, MACD: {macd:.4f}",
    }

# ============================================================================
# GÉNÉRATEUR DE SIGNAUX TECHNIQUES
# ============================================================================
def generate_signals(market: dict) -> list:
    rsi   = market["rsi"]
    macd  = market["macd"]
    ema20 = market["ema20"]
    ema50 = market["ema50"]

    return [
        {
            "signalType": "RSI",
            "value":      rsi,
            "threshold":  30 if rsi < 50 else 70,
            "triggered":  rsi < 30 or rsi > 70,
            "timeframe":  "1h",
        },
        {
            "signalType": "MACD",
            "value":      round(macd, 6),
            "threshold":  0,
            "triggered":  macd > 0,
            "timeframe":  "1h",
        },
        {
            "signalType": "EMA_CROSS",
            "value":      round(ema20 - ema50, 6),
            "threshold":  0,
            "triggered":  ema20 > ema50,
            "timeframe":  "4h",
        },
    ]

# ============================================================================
# BOUCLE PRINCIPALE — 24 HEURES × 5 ASSETS
# ============================================================================
def run_forwardtest():
    decisions_file = OUTPUT_DIR / "decisions.jsonl"
    signals_file   = OUTPUT_DIR / "signals.jsonl"
    equity_file    = OUTPUT_DIR / "equity.csv.jsonl"

    capital      = CAPITAL_INITIAL
    positions    = {}
    daily_trades = 0

    decision_count = 0
    signal_count   = 0
    equity_count   = 0

    start_dt = datetime(2026, 3, 9, 0, 0, 0)

    with open(decisions_file, "w") as df, \
         open(signals_file,   "w") as sf, \
         open(equity_file,    "w") as ef:

        for hour in range(24):
            current_dt = start_dt + timedelta(hours=hour)
            ts = current_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Snapshot equity horaire
            positions_value = sum(
                pos["quantity"] * BASE_PRICES[asset] * (1 + random.gauss(0, 0.004))
                for asset, pos in positions.items()
            ) if positions else 0

            total_equity  = capital + positions_value
            daily_pnl     = total_equity - CAPITAL_INITIAL
            cumulative_pnl = daily_pnl

            ef.write(json.dumps({
                "timestamp":      ts,
                "userId":         USER_ID,
                "cashBalance":    round(capital, 4),
                "positionsValue": round(positions_value, 4),
                "totalEquity":    round(total_equity, 4),
                "openPositions":  len(positions),
                "dailyPnL":       round(daily_pnl, 4),
                "cumulativePnL":  round(cumulative_pnl, 4),
                "observationMode": OBSERVATION_MODE,
            }) + "\n")
            equity_count += 1

            # Évaluation de chaque asset
            for asset in ASSETS:
                market = generate_market_data(asset, BASE_PRICES[asset], hour)

                # Signaux techniques
                for sig in generate_signals(market):
                    sf.write(json.dumps({
                        "timestamp":      ts,
                        "userId":         USER_ID,
                        "asset":          asset,
                        **sig,
                        "observationMode": OBSERVATION_MODE,
                    }) + "\n")
                    signal_count += 1

                # Décision
                decision = make_decision(market, positions, daily_trades, capital)

                portfolio_before = capital + sum(
                    pos["quantity"] * BASE_PRICES[a] for a, pos in positions.items()
                )
                # OBSERVATION_MODE : pas de modification du portefeuille
                portfolio_after = portfolio_before

                df.write(json.dumps({
                    "timestamp":           ts,
                    "userId":              USER_ID,
                    "asset":               asset,
                    "action":              decision["action"],
                    "confidence":          decision.get("confidence", 0.6),
                    "price":               market["price"],
                    "quantity":            decision.get("quantity", 0),
                    "reason":              decision.get("reason", ""),
                    "rejectReason":        decision.get("rejectReason", None),
                    "portfolioValueBefore": round(portfolio_before, 4),
                    "portfolioValueAfter":  round(portfolio_after, 4),
                    "indicators": {
                        "rsi":           market["rsi"],
                        "macd":          market["macd"],
                        "ema20":         market["ema20"],
                        "ema50":         market["ema50"],
                        "volume24h":     market["volume24h"],
                        "priceChange24h": market["priceChange24h"],
                    },
                    "observationMode": OBSERVATION_MODE,
                }) + "\n")
                decision_count += 1

    # ============================================================================
    # CHECKSUMS SHA256
    # ============================================================================
    def sha256_file(path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            h.update(f.read())
        return h.hexdigest()

    def count_lines(path):
        with open(path, "r") as f:
            return sum(1 for line in f if line.strip())

    # ============================================================================
    # STATISTIQUES FINALES
    # ============================================================================
    with open(decisions_file) as f:
        all_decisions = [json.loads(l) for l in f if l.strip()]

    buy_count    = sum(1 for d in all_decisions if d["action"] == "BUY")
    sell_count   = sum(1 for d in all_decisions if d["action"] == "SELL")
    hold_count   = sum(1 for d in all_decisions if d["action"] == "HOLD")
    reject_count = sum(1 for d in all_decisions if d["action"] == "REJECT")

    reject_reasons = {}
    for d in all_decisions:
        if d["action"] == "REJECT" and d.get("rejectReason"):
            r = d["rejectReason"]
            reject_reasons[r] = reject_reasons.get(r, 0) + 1

    with open(equity_file) as f:
        equity_records = [json.loads(l) for l in f if l.strip()]
    final_equity   = equity_records[-1]["totalEquity"] if equity_records else CAPITAL_INITIAL
    final_pnl      = final_equity - CAPITAL_INITIAL
    final_pnl_pct  = (final_pnl / CAPITAL_INITIAL) * 100

    with open(signals_file) as f:
        all_signals = [json.loads(l) for l in f if l.strip()]
    triggered_count   = sum(1 for s in all_signals if s.get("triggered"))
    triggered_by_type = {}
    for s in all_signals:
        if s.get("triggered"):
            t = s["signalType"]
            triggered_by_type[t] = triggered_by_type.get(t, 0) + 1

    # ============================================================================
    # MANIFEST.JSON
    # ============================================================================
    manifest = {
        "version":        "1.0",
        "phase":          "1.4",
        "day":            DAY_LABEL,
        "date":           DATE,
        "window":         {"from": WINDOW_FROM, "to": WINDOW_TO},
        "generatedAt":    datetime.utcnow().isoformat() + "Z",
        "observationMode": OBSERVATION_MODE,
        "randomSeed":     RANDOM_SEED,
        "capitalInitial": CAPITAL_INITIAL,
        "capitalFinal":   round(final_equity, 4),
        "pnl":            round(final_pnl, 4),
        "pnlPercent":     round(final_pnl_pct, 4),
        "assets":         ASSETS,
        "marketContext":  "Reprise progressive post-consolidation J4 — BTC/ETH rebond modéré, SOL continuation forte",
        "stats": {
            "totalDecisions":  decision_count,
            "buyCount":        buy_count,
            "sellCount":       sell_count,
            "holdCount":       hold_count,
            "rejectCount":     reject_count,
            "totalSignals":    signal_count,
            "triggeredSignals": triggered_count,
            "triggeredByType": triggered_by_type,
            "equitySnapshots": equity_count,
            "topRejectReasons": reject_reasons,
            "holdVsRejectNote": "HOLD=signal absent/insuffisant | REJECT=MAX_DAILY_TRADES atteint",
        },
        "files": {
            "decisions.jsonl": {
                "exists":      True,
                "sizeBytes":   decisions_file.stat().st_size,
                "sha256":      sha256_file(decisions_file),
                "recordCount": count_lines(decisions_file),
            },
            "signals.jsonl": {
                "exists":      True,
                "sizeBytes":   signals_file.stat().st_size,
                "sha256":      sha256_file(signals_file),
                "recordCount": count_lines(signals_file),
            },
            "equity.csv.jsonl": {
                "exists":      True,
                "sizeBytes":   equity_file.stat().st_size,
                "sha256":      sha256_file(equity_file),
                "recordCount": count_lines(equity_file),
            },
        },
    }

    manifest_file = OUTPUT_DIR / "manifest.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)

    # ============================================================================
    # CHECKSUMS.TXT
    # ============================================================================
    checksums_file = OUTPUT_DIR / "checksums.txt"
    with open(checksums_file, "w") as f:
        for fname in ["decisions.jsonl", "signals.jsonl", "equity.csv.jsonl"]:
            sha = manifest["files"][fname]["sha256"]
            f.write(f"{sha}  {fname}\n")

    # ============================================================================
    # AFFICHAGE
    # ============================================================================
    print(f"\n✅ Forward Test {DAY_LABEL} terminé")
    print(f"")
    print(f"📊 STATISTIQUES {DAY_LABEL} :")
    print(f"   Capital initial  : {CAPITAL_INITIAL:.2f} EUR")
    print(f"   Capital final    : {final_equity:.4f} EUR")
    print(f"   PnL              : {final_pnl:+.4f} EUR ({final_pnl_pct:+.2f}%)")
    print(f"")
    print(f"📋 DÉCISIONS :")
    print(f"   Total            : {decision_count}")
    print(f"   BUY              : {buy_count}")
    print(f"   SELL             : {sell_count}")
    print(f"   HOLD             : {hold_count}  ← signal absent/insuffisant")
    print(f"   REJECT           : {reject_count}  ← MAX_DAILY_TRADES atteint (0=normal)")
    print(f"")
    print(f"📡 SIGNAUX         : {signal_count} (triggered: {triggered_count})")
    for t, c in sorted(triggered_by_type.items()):
        print(f"   {t}: {c}")
    print(f"📈 EQUITY SNAPS    : {equity_count}")
    print(f"")
    print(f"📁 FICHIERS GÉNÉRÉS :")
    print(f"   {decisions_file}")
    print(f"   {signals_file}")
    print(f"   {equity_file}")
    print(f"   {manifest_file}")
    print(f"   {checksums_file}")
    print(f"")
    print(f"🔐 CHECKSUMS SHA256 :")
    print(f"   decisions.jsonl    : {manifest['files']['decisions.jsonl']['sha256'][:16]}...")
    print(f"   signals.jsonl      : {manifest['files']['signals.jsonl']['sha256'][:16]}...")
    print(f"   equity.csv.jsonl   : {manifest['files']['equity.csv.jsonl']['sha256'][:16]}...")

    return manifest


if __name__ == "__main__":
    run_forwardtest()
