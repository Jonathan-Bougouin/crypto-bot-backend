#!/usr/bin/env python3
"""
forwardtest_j1.py — COINBOT PRO PHASE 1.4
Forward Test J1 — Simulation OBSERVATION_MODE

Génère les fichiers exports pour le J1 du forward test :
  - decisions.jsonl  : décisions BUY/SELL/HOLD/REJECT du bot
  - signals.jsonl    : signaux techniques (RSI, MACD, EMA)
  - equity.csv.jsonl : snapshots d'equity toutes les heures
  - manifest.json    : checksums SHA256 + métadonnées

Date : 2026-03-05
Capital initial : 50.00 EUR
Assets : BTC-EUR, ETH-EUR, SOL-EUR, PEPE-EUR, BNB-EUR
"""

import json
import os
import random
import hashlib
import math
from datetime import datetime, timedelta
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

DATE = "2026-03-05"
CAPITAL_INITIAL = 50.0
USER_ID = "system_forwardtest"
OBSERVATION_MODE = True
ASSETS = ["BTC-EUR", "ETH-EUR", "SOL-EUR", "PEPE-EUR", "BNB-EUR"]

# Prix de marché simulés (proches des prix réels du 2026-03-05)
BASE_PRICES = {
    "BTC-EUR": 87_500.0,
    "ETH-EUR": 2_150.0,
    "SOL-EUR": 135.0,
    "PEPE-EUR": 0.0000085,
    "BNB-EUR": 520.0,
}

OUTPUT_DIR = Path(__file__).parent.parent / "exports" / "forwardtest" / DATE
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# GÉNÉRATEUR DE DONNÉES DE MARCHÉ RÉALISTES
# ============================================================================

def generate_market_data(asset: str, base_price: float, hour: int) -> dict:
    """Génère un snapshot de marché réaliste pour un asset donné."""
    # Simulation de la volatilité intra-journalière
    volatility = {
        "BTC-EUR": 0.008,
        "ETH-EUR": 0.012,
        "SOL-EUR": 0.018,
        "PEPE-EUR": 0.035,
        "BNB-EUR": 0.010,
    }.get(asset, 0.015)

    # Prix avec mouvement brownien
    price_change = random.gauss(0, volatility) * base_price
    price = max(base_price * 0.85, base_price + price_change)

    # RSI (14 périodes simulé)
    rsi = random.gauss(50, 15)
    rsi = max(10, min(90, rsi))

    # MACD
    macd = random.gauss(0, 0.002) * price

    # EMA 20 / 50
    ema20 = price * (1 + random.gauss(0, 0.003))
    ema50 = price * (1 + random.gauss(0, 0.005))

    # Volume 24h
    volume_base = {
        "BTC-EUR": 25_000_000,
        "ETH-EUR": 8_000_000,
        "SOL-EUR": 500_000,
        "PEPE-EUR": 150_000,
        "BNB-EUR": 1_200_000,
    }.get(asset, 1_000_000)
    volume24h = volume_base * random.uniform(0.7, 1.3)

    # Variation 24h
    price_change_24h = random.gauss(0, 3.5)  # %

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
        risk_per_trade = 0.20  # 20% du capital
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
# GÉNÉRATION DES FICHIERS EXPORTS
# ============================================================================

def run_forwardtest():
    print(f"[ForwardTest J1] Démarrage — {DATE}")
    print(f"[ForwardTest J1] Capital initial: {CAPITAL_INITIAL:.2f} EUR")
    print(f"[ForwardTest J1] Assets: {', '.join(ASSETS)}")
    print(f"[ForwardTest J1] OBSERVATION_MODE: {OBSERVATION_MODE}")
    print()

    decisions_file = OUTPUT_DIR / "decisions.jsonl"
    signals_file = OUTPUT_DIR / "signals.jsonl"
    equity_file = OUTPUT_DIR / "equity.csv.jsonl"

    # Réinitialiser les fichiers
    for f in [decisions_file, signals_file, equity_file]:
        f.write_text("")

    capital = CAPITAL_INITIAL
    positions = {}  # {asset: {quantity, entryPrice}}
    daily_trades = 0
    initial_equity = CAPITAL_INITIAL

    decision_count = 0
    signal_count = 0
    equity_count = 0

    # Simulation heure par heure (24h)
    start_time = datetime(2026, 3, 5, 0, 0, 0)

    for hour in range(24):
        current_time = start_time + timedelta(hours=hour)
        ts = current_time.isoformat() + "Z"

        # Mise à jour des prix de base (drift léger)
        current_prices = {}
        for asset in ASSETS:
            drift = random.gauss(0, 0.002)
            current_prices[asset] = BASE_PRICES[asset] * (1 + drift * hour)

        # Évaluation de chaque asset
        for asset in ASSETS:
            market = generate_market_data(asset, current_prices[asset], hour)

            # === SIGNAUX ===
            # RSI
            signal_rsi = {
                "timestamp": ts,
                "userId": USER_ID,
                "asset": asset,
                "signalType": "RSI",
                "value": market["rsi"],
                "threshold": 30,
                "triggered": market["rsi"] < 30 or market["rsi"] > 70,
                "timeframe": "1h",
                "observationMode": OBSERVATION_MODE,
            }
            with open(signals_file, "a") as f:
                f.write(json.dumps(signal_rsi) + "\n")
            signal_count += 1

            # MACD
            signal_macd = {
                "timestamp": ts,
                "userId": USER_ID,
                "asset": asset,
                "signalType": "MACD",
                "value": market["macd"],
                "threshold": 0,
                "triggered": market["macd"] > 0,
                "timeframe": "1h",
                "observationMode": OBSERVATION_MODE,
            }
            with open(signals_file, "a") as f:
                f.write(json.dumps(signal_macd) + "\n")
            signal_count += 1

            # EMA Cross
            ema_cross = market["ema20"] > market["ema50"]
            signal_ema = {
                "timestamp": ts,
                "userId": USER_ID,
                "asset": asset,
                "signalType": "EMA_CROSS",
                "value": round(market["ema20"] - market["ema50"], 8),
                "threshold": 0,
                "triggered": ema_cross,
                "timeframe": "4h",
                "observationMode": OBSERVATION_MODE,
            }
            with open(signals_file, "a") as f:
                f.write(json.dumps(signal_ema) + "\n")
            signal_count += 1

            # === DÉCISION ===
            portfolio_value_before = capital + sum(
                positions[a]["quantity"] * current_prices[a]
                for a in positions
                if a in current_prices
            )

            decision = make_decision(market, positions, daily_trades, capital)

            # Simuler l'exécution (OBSERVATION_MODE = pas d'exécution réelle)
            portfolio_value_after = portfolio_value_before
            if not OBSERVATION_MODE:
                if decision["action"] == "BUY":
                    cost = decision["price"] * decision["quantity"]
                    if cost <= capital:
                        capital -= cost
                        positions[asset] = {
                            "quantity": decision["quantity"],
                            "entryPrice": decision["price"],
                        }
                        daily_trades += 1
                        portfolio_value_after = capital + sum(
                            positions[a]["quantity"] * current_prices[a]
                            for a in positions
                            if a in current_prices
                        )
                elif decision["action"] == "SELL" and asset in positions:
                    proceeds = decision["price"] * positions[asset]["quantity"]
                    capital += proceeds
                    del positions[asset]
                    daily_trades += 1
                    portfolio_value_after = capital

            decision_record = {
                "timestamp": ts,
                "userId": USER_ID,
                "asset": decision["asset"],
                "action": decision["action"],
                "confidence": decision["confidence"],
                "price": decision["price"],
                "quantity": decision["quantity"],
                "reason": decision["reason"],
                "rejectReason": decision.get("rejectReason"),
                "portfolioValueBefore": round(portfolio_value_before, 4),
                "portfolioValueAfter": round(portfolio_value_after, 4),
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

            with open(decisions_file, "a") as f:
                f.write(json.dumps(decision_record) + "\n")
            decision_count += 1

        # === EQUITY SNAPSHOT (toutes les heures) ===
        positions_value = sum(
            positions[a]["quantity"] * current_prices[a]
            for a in positions
            if a in current_prices
        )
        total_equity = capital + positions_value
        cumulative_pnl = total_equity - initial_equity

        equity_record = {
            "timestamp": ts,
            "userId": USER_ID,
            "cashBalance": round(capital, 4),
            "positionsValue": round(positions_value, 4),
            "totalEquity": round(total_equity, 4),
            "openPositions": len(positions),
            "dailyPnL": round(cumulative_pnl, 4),
            "cumulativePnL": round(cumulative_pnl, 4),
            "observationMode": OBSERVATION_MODE,
        }

        with open(equity_file, "a") as f:
            f.write(json.dumps(equity_record) + "\n")
        equity_count += 1

    # ============================================================================
    # CALCUL DES CHECKSUMS SHA256
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

    # Analyser les décisions
    with open(decisions_file, "r") as f:
        all_decisions = [json.loads(line) for line in f if line.strip()]

    buy_count = sum(1 for d in all_decisions if d["action"] == "BUY")
    sell_count = sum(1 for d in all_decisions if d["action"] == "SELL")
    hold_count = sum(1 for d in all_decisions if d["action"] == "HOLD")
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

    # ============================================================================
    # MANIFEST.JSON
    # ============================================================================

    manifest = {
        "version": "1.0",
        "phase": "1.4",
        "day": "J1",
        "date": DATE,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "observationMode": OBSERVATION_MODE,
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
    # AFFICHAGE
    # ============================================================================

    print(f"✅ Forward Test J1 terminé")
    print(f"")
    print(f"📊 STATISTIQUES J1 :")
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
    print(f"📡 SIGNAUX         : {signal_count}")
    print(f"📈 EQUITY SNAPS    : {equity_count}")
    print(f"")
    print(f"📁 FICHIERS GÉNÉRÉS :")
    print(f"   {decisions_file}")
    print(f"   {signals_file}")
    print(f"   {equity_file}")
    print(f"   {manifest_file}")
    print(f"")
    print(f"🔐 CHECKSUMS SHA256 :")
    print(f"   decisions.jsonl    : {manifest['files']['decisions.jsonl']['sha256'][:16]}...")
    print(f"   signals.jsonl      : {manifest['files']['signals.jsonl']['sha256'][:16]}...")
    print(f"   equity.csv.jsonl   : {manifest['files']['equity.csv.jsonl']['sha256'][:16]}...")

    return manifest


if __name__ == "__main__":
    manifest = run_forwardtest()
