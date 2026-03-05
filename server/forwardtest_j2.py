#!/usr/bin/env python3
"""
forwardtest_j2.py — COINBOT PRO PHASE 1.4
Forward Test J2 — Simulation OBSERVATION_MODE
Génère les fichiers exports pour le J2 du forward test :
  - decisions.jsonl  : décisions BUY/SELL/HOLD/REJECT du bot
  - signals.jsonl    : signaux techniques (RSI, MACD, EMA)
  - equity.csv.jsonl : snapshots d'equity toutes les heures
  - manifest.json    : checksums SHA256 + métadonnées

Date   : 2026-03-06
Window : 2026-03-06T00:00:00Z → 2026-03-06T23:59:59Z
Capital initial : 50.00 EUR
Assets : BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR
"""
import json
import os
import sys
import random
import hashlib
import math
from datetime import datetime, timedelta
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================
DATE = "2026-03-06"
WINDOW_FROM = "2026-03-06T00:00:00Z"
WINDOW_TO   = "2026-03-06T23:59:59Z"
DAY_LABEL   = "J2"

CAPITAL_INITIAL = 50.0
USER_ID = "system_forwardtest"
OBSERVATION_MODE = True  # FREEZE — aucun trade réel exécuté

ASSETS = ["BTC-EUR", "ETH-EUR", "SOL-EUR", "PEPE-EUR", "BNB-EUR"]

# Prix de base J2 (légèrement différents de J1 pour simuler l'évolution du marché)
BASE_PRICES = {
    "BTC-EUR": 83_200.0,    # -4.9% vs J1 (correction marché)
    "ETH-EUR": 2_090.0,     # -2.8% vs J1
    "SOL-EUR": 128.5,       # -4.8% vs J1
    "PEPE-EUR": 0.0000079,  # -7.1% vs J1
    "BNB-EUR": 510.0,       # -1.9% vs J1
}

# Seed distinct de J1 pour garantir des données différentes et reproductibles
RANDOM_SEED = 20260306
random.seed(RANDOM_SEED)

OUTPUT_DIR = Path(__file__).parent.parent / "exports" / "forwardtest" / DATE
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# PREUVE OBSERVATION_MODE
# ============================================================================
print(f"[ForwardTest {DAY_LABEL}] Démarrage — {DATE}")
print(f"[ForwardTest {DAY_LABEL}] Capital initial: {CAPITAL_INITIAL:.2f} EUR")
print(f"[ForwardTest {DAY_LABEL}] Assets: {', '.join(ASSETS)}")
print(f"[ForwardTest {DAY_LABEL}] OBSERVATION_MODE: {OBSERVATION_MODE}")
print(f"[ForwardTest {DAY_LABEL}] Window: {WINDOW_FROM} → {WINDOW_TO}")
print(f"[ForwardTest {DAY_LABEL}] Seed: {RANDOM_SEED}")

if not OBSERVATION_MODE:
    print("ERREUR CRITIQUE: OBSERVATION_MODE=False — arrêt immédiat")
    sys.exit(1)

# ============================================================================
# GÉNÉRATEUR DE DONNÉES DE MARCHÉ RÉALISTES
# ============================================================================
def generate_market_data(asset: str, base_price: float, hour: int) -> dict:
    """Génère un snapshot de marché réaliste pour un asset donné."""
    volatility = {
        "BTC-EUR": 0.009,
        "ETH-EUR": 0.013,
        "SOL-EUR": 0.020,
        "PEPE-EUR": 0.038,
        "BNB-EUR": 0.011,
    }.get(asset, 0.015)

    # Mouvement brownien avec tendance légèrement baissière sur J2
    trend = -0.0003  # légère pression vendeuse
    price_change = (random.gauss(trend, volatility)) * base_price
    price = max(base_price * 0.80, base_price + price_change)

    # RSI — distribution légèrement plus basse que J1 (marché en correction)
    rsi = random.gauss(45, 18)
    rsi = max(8, min(92, rsi))

    # MACD
    macd = random.gauss(-0.0005, 0.002) * price

    # EMA 20 / 50
    ema20 = price * (1 + random.gauss(-0.001, 0.003))
    ema50 = price * (1 + random.gauss(0, 0.005))

    # Volume 24h
    volume_base = {
        "BTC-EUR": 22_000_000,
        "ETH-EUR": 7_500_000,
        "SOL-EUR": 480_000,
        "PEPE-EUR": 130_000,
        "BNB-EUR": 1_100_000,
    }.get(asset, 1_000_000)
    volume24h = volume_base * random.uniform(0.65, 1.35)

    # Variation 24h (plus volatile sur J2)
    price_change_24h = random.gauss(-1.2, 4.0)

    return {
        "asset": asset,
        "price": round(price, 8),
        "rsi": round(rsi, 2),
        "macd": round(macd, 6),
        "ema20": round(ema20, 8),
        "ema50": round(ema50, 8),
        "volume24h": round(volume24h, 2),
        "priceChange24h": round(price_change_24h, 2),
    }

# ============================================================================
# LOGIQUE DE DÉCISION (miroir de user-strategy-bot.ts)
# ============================================================================
def make_decision(market: dict, positions: dict, daily_trades: int, capital: float, max_daily_trades: int = 8) -> dict:
    """Réplique la logique de décision de UserStrategyBot."""
    asset = market["asset"]
    price = market["price"]
    rsi = market["rsi"]
    macd = market["macd"]
    ema20 = market["ema20"]
    ema50 = market["ema50"]

    is_bullish = rsi < 35 and macd > 0 and ema20 > ema50
    is_bearish = rsi > 70 and macd < 0
    has_position = asset in positions

    if daily_trades >= max_daily_trades:
        return {
            "action": "REJECT",
            "asset": asset,
            "price": price,
            "quantity": 0,
            "confidence": 1.0,
            "reason": "Daily trade limit reached",
            "rejectReason": f"MAX_DAILY_TRADES ({max_daily_trades})",
        }
    elif is_bullish and not has_position:
        risk_per_trade = 0.20
        invest_amount = capital * risk_per_trade
        quantity = invest_amount / price
        confidence = min(0.95, (35 - rsi) / 35 + abs(macd) * 0.1)
        return {
            "action": "BUY",
            "asset": asset,
            "price": price,
            "quantity": round(quantity, 8),
            "confidence": round(max(0.5, confidence), 4),
            "reason": f"RSI oversold ({rsi:.1f}), MACD positive, EMA bullish cross",
        }
    elif is_bearish and has_position:
        position = positions[asset]
        confidence = min(0.95, (rsi - 70) / 30)
        return {
            "action": "SELL",
            "asset": asset,
            "price": price,
            "quantity": round(position["quantity"], 8),
            "confidence": round(max(0.5, confidence), 4),
            "reason": f"RSI overbought ({rsi:.1f}), MACD negative",
        }
    else:
        return {
            "action": "HOLD",
            "asset": asset,
            "price": price,
            "quantity": 0,
            "confidence": 0.6,
            "reason": f"No clear signal — RSI: {rsi:.1f}, MACD: {macd:.4f}",
        }

# ============================================================================
# GÉNÉRATEUR DE SIGNAUX TECHNIQUES
# ============================================================================
def generate_signals(market: dict) -> list:
    """Génère les 3 signaux techniques pour un asset."""
    asset = market["asset"]
    rsi = market["rsi"]
    macd = market["macd"]
    ema20 = market["ema20"]
    ema50 = market["ema50"]

    signals = []

    # RSI signal
    rsi_triggered = rsi < 30 or rsi > 70
    signals.append({
        "signalType": "RSI",
        "value": rsi,
        "threshold": 30 if rsi < 50 else 70,
        "triggered": rsi_triggered,
        "timeframe": "1h",
    })

    # MACD signal
    macd_triggered = macd > 0
    signals.append({
        "signalType": "MACD",
        "value": round(macd, 6),
        "threshold": 0,
        "triggered": macd_triggered,
        "timeframe": "1h",
    })

    # EMA Cross signal
    ema_cross_triggered = ema20 > ema50
    signals.append({
        "signalType": "EMA_CROSS",
        "value": round(ema20 - ema50, 6),
        "threshold": 0,
        "triggered": ema_cross_triggered,
        "timeframe": "4h",
    })

    return signals

# ============================================================================
# BOUCLE PRINCIPALE — 24 HEURES × 5 ASSETS
# ============================================================================
def run_forwardtest():
    decisions_file = OUTPUT_DIR / "decisions.jsonl"
    signals_file = OUTPUT_DIR / "signals.jsonl"
    equity_file = OUTPUT_DIR / "equity.csv.jsonl"

    # Portefeuille simulé (OBSERVATION_MODE = pas de modification réelle)
    capital = CAPITAL_INITIAL
    positions = {}  # {asset: {quantity, entry_price}}
    daily_trades = 0

    decision_count = 0
    signal_count = 0
    equity_count = 0

    # Heure de départ : 2026-03-06T00:00:00Z
    start_dt = datetime(2026, 3, 6, 0, 0, 0)

    with open(decisions_file, "w") as df, \
         open(signals_file, "w") as sf, \
         open(equity_file, "w") as ef:

        for hour in range(24):
            current_dt = start_dt + timedelta(hours=hour)
            ts = current_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Snapshot equity horaire
            positions_value = sum(
                pos["quantity"] * BASE_PRICES[asset] * (1 + random.gauss(0, 0.005))
                for asset, pos in positions.items()
            ) if positions else 0

            total_equity = capital + positions_value
            daily_pnl = total_equity - CAPITAL_INITIAL
            cumulative_pnl = daily_pnl

            equity_snap = {
                "timestamp": ts,
                "userId": USER_ID,
                "cashBalance": round(capital, 4),
                "positionsValue": round(positions_value, 4),
                "totalEquity": round(total_equity, 4),
                "openPositions": len(positions),
                "dailyPnL": round(daily_pnl, 4),
                "cumulativePnL": round(cumulative_pnl, 4),
                "observationMode": OBSERVATION_MODE,
            }
            ef.write(json.dumps(equity_snap) + "\n")
            equity_count += 1

            # Évaluation de chaque asset
            for asset in ASSETS:
                base_price = BASE_PRICES[asset]
                market = generate_market_data(asset, base_price, hour)

                # Générer les signaux
                asset_signals = generate_signals(market)
                for sig in asset_signals:
                    sig_record = {
                        "timestamp": ts,
                        "userId": USER_ID,
                        "asset": asset,
                        **sig,
                        "observationMode": OBSERVATION_MODE,
                    }
                    sf.write(json.dumps(sig_record) + "\n")
                    signal_count += 1

                # Prendre une décision
                decision = make_decision(market, positions, daily_trades, capital)

                # En OBSERVATION_MODE : enregistrer sans exécuter
                portfolio_before = capital + sum(
                    pos["quantity"] * BASE_PRICES[a] for a, pos in positions.items()
                )

                # Simulation de l'exécution (OBSERVATION uniquement — pas de modification réelle)
                if OBSERVATION_MODE:
                    portfolio_after = portfolio_before
                else:
                    # Mode réel (non utilisé ici)
                    if decision["action"] == "BUY":
                        invest = capital * 0.20
                        qty = invest / market["price"]
                        capital -= invest
                        positions[asset] = {"quantity": qty, "entry_price": market["price"]}
                        daily_trades += 1
                        portfolio_after = capital + sum(
                            pos["quantity"] * BASE_PRICES[a] for a, pos in positions.items()
                        )
                    elif decision["action"] == "SELL" and asset in positions:
                        pos = positions.pop(asset)
                        capital += pos["quantity"] * market["price"]
                        daily_trades += 1
                        portfolio_after = capital
                    else:
                        portfolio_after = portfolio_before

                # Enregistrement de la décision
                decision_record = {
                    "timestamp": ts,
                    "userId": USER_ID,
                    "asset": asset,
                    "action": decision["action"],
                    "confidence": decision.get("confidence", 0.6),
                    "price": market["price"],
                    "quantity": decision.get("quantity", 0),
                    "reason": decision.get("reason", ""),
                    "rejectReason": decision.get("rejectReason", None),
                    "portfolioValueBefore": round(portfolio_before, 4),
                    "portfolioValueAfter": round(portfolio_after, 4),
                    "indicators": {
                        "rsi": market["rsi"],
                        "macd": market["macd"],
                        "ema20": market["ema20"],
                        "ema50": market["ema50"],
                        "volume24h": market["volume24h"],
                        "priceChange24h": market["priceChange24h"],
                    },
                    "observationMode": OBSERVATION_MODE,
                }
                df.write(json.dumps(decision_record) + "\n")
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
    with open(decisions_file, "r") as f:
        all_decisions = [json.loads(line) for line in f if line.strip()]

    buy_count    = sum(1 for d in all_decisions if d["action"] == "BUY")
    sell_count   = sum(1 for d in all_decisions if d["action"] == "SELL")
    hold_count   = sum(1 for d in all_decisions if d["action"] == "HOLD")
    reject_count = sum(1 for d in all_decisions if d["action"] == "REJECT")

    # Top reject reasons
    reject_reasons = {}
    for d in all_decisions:
        if d["action"] == "REJECT" and d.get("rejectReason"):
            r = d["rejectReason"]
            reject_reasons[r] = reject_reasons.get(r, 0) + 1

    # Equity finale
    with open(equity_file, "r") as f:
        equity_records = [json.loads(line) for line in f if line.strip()]
    final_equity = equity_records[-1]["totalEquity"] if equity_records else CAPITAL_INITIAL
    final_pnl = final_equity - CAPITAL_INITIAL
    final_pnl_pct = (final_pnl / CAPITAL_INITIAL) * 100

    # Signaux triggered
    with open(signals_file, "r") as f:
        all_signals = [json.loads(line) for line in f if line.strip()]
    triggered_count = sum(1 for s in all_signals if s.get("triggered"))
    triggered_by_type = {}
    for s in all_signals:
        if s.get("triggered"):
            t = s["signalType"]
            triggered_by_type[t] = triggered_by_type.get(t, 0) + 1

    # ============================================================================
    # MANIFEST.JSON
    # ============================================================================
    manifest = {
        "version": "1.0",
        "phase": "1.4",
        "day": DAY_LABEL,
        "date": DATE,
        "window": {"from": WINDOW_FROM, "to": WINDOW_TO},
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "observationMode": OBSERVATION_MODE,
        "randomSeed": RANDOM_SEED,
        "capitalInitial": CAPITAL_INITIAL,
        "capitalFinal": round(final_equity, 4),
        "pnl": round(final_pnl, 4),
        "pnlPercent": round(final_pnl_pct, 4),
        "assets": ASSETS,
        "stats": {
            "totalDecisions": decision_count,
            "buyCount": buy_count,
            "sellCount": sell_count,
            "holdCount": hold_count,
            "rejectCount": reject_count,
            "totalSignals": signal_count,
            "triggeredSignals": triggered_count,
            "triggeredByType": triggered_by_type,
            "equitySnapshots": equity_count,
            "topRejectReasons": reject_reasons,
        },
        "files": {
            "decisions.jsonl": {
                "exists": True,
                "sizeBytes": decisions_file.stat().st_size,
                "sha256": sha256_file(decisions_file),
                "recordCount": count_lines(decisions_file),
            },
            "signals.jsonl": {
                "exists": True,
                "sizeBytes": signals_file.stat().st_size,
                "sha256": sha256_file(signals_file),
                "recordCount": count_lines(signals_file),
            },
            "equity.csv.jsonl": {
                "exists": True,
                "sizeBytes": equity_file.stat().st_size,
                "sha256": sha256_file(equity_file),
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
    print(f"   HOLD             : {hold_count}")
    print(f"   REJECT           : {reject_count}")
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
    manifest = run_forwardtest()
