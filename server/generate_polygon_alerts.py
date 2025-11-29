#!/usr/bin/env python3
"""
Script de génération d'alertes de trading basé sur les données Polygon.io.
"""

import sys
import os
import json
from datetime import datetime, timedelta
import mysql.connector
from mysql.connector import Error
from urllib.parse import urlparse
from polygon import RESTClient

# Récupération des variables d'environnement
DATABASE_URL = os.getenv('DATABASE_URL')
POLYGON_API_KEY = os.getenv('POLYGON_API_KEY')

if not DATABASE_URL:
    print("Erreur: DATABASE_URL n'est pas défini dans l'environnement.")
    sys.exit(1)

if not POLYGON_API_KEY:
    print("Erreur: POLYGON_API_KEY n'est pas défini dans l'environnement.")
    sys.exit(1)

# Parse DATABASE_URL
try:
    parsed = urlparse(DATABASE_URL)
    username = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port if parsed.port else 3306
    database = parsed.path.lstrip('/')
    
    ssl_config = None
    if parsed.query and 'ssl' in parsed.query:
        ssl_config = {
            'ssl_disabled': False,
            'ssl_verify_cert': False,
            'ssl_verify_identity': False
        }
except Exception as e:
    print(f"Erreur lors du parsing de DATABASE_URL: {e}")
    sys.exit(1)

# Configuration Polygon
client = RESTClient(api_key=POLYGON_API_KEY)

TICKER_MAP = {
    'BTC-USD': 'X:BTCUSD',
    'ETH-USD': 'X:ETHUSD',
    'PEPE-USD': 'X:PEPEUSD',
}

def create_connection():
    """Crée une connexion à la base de données MySQL."""
    try:
        config = {
            'host': host,
            'port': port,
            'user': username,
            'password': password,
            'database': database
        }
        
        if ssl_config:
            config.update(ssl_config)
        
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Erreur de connexion à MySQL: {e}")
        return None

def fetch_market_data(ticker, days=7):
    """Récupère les données de marché depuis Polygon."""
    try:
        from_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        to_date = datetime.now().strftime('%Y-%m-%d')
        
        aggs = list(client.list_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="hour",
            from_=from_date,
            to=to_date,
            limit=200
        ))
        
        return aggs
    except Exception as e:
        print(f"Erreur lors de la récupération des données pour {ticker}: {e}")
        return None

def calculate_rsi(prices, period=14):
    """Calcule le RSI."""
    if len(prices) < period + 1:
        return 50
    
    changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [c if c > 0 else 0 for c in changes]
    losses = [abs(c) if c < 0 else 0 for c in changes]
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

def analyze_coin(symbol, ticker, market_data):
    """Analyse un coin et génère une alerte si nécessaire."""
    if not market_data or len(market_data) < 20:
        return None
    
    # Données actuelles (dernière barre)
    current = market_data[-1]
    price = current.close
    volume = current.volume
    
    # Calculer les prix de clôture
    close_prices = [agg.close for agg in market_data]
    volumes = [agg.volume for agg in market_data]
    
    # Calculer le RSI
    rsi = calculate_rsi(close_prices)
    
    # Calculer les Bollinger Bands
    period = min(20, len(close_prices))
    recent_prices = close_prices[-period:]
    sma = sum(recent_prices) / period
    variance = sum((p - sma) ** 2 for p in recent_prices) / period
    std_dev = variance ** 0.5
    upper_band = sma + (2 * std_dev)
    lower_band = sma - (2 * std_dev)
    bandwidth = (upper_band - lower_band) / sma if sma > 0 else 0
    
    # Calculer le changement 24h
    if len(close_prices) >= 24:
        price_24h_ago = close_prices[-24]
        change_24h = ((price - price_24h_ago) / price_24h_ago) * 100 if price_24h_ago > 0 else 0
    else:
        change_24h = 0
    
    # Détection des signaux
    signals = []
    confidence = "Moyenne"
    signal_type = "PRE_PUMP_VOLATILITY"
    
    # Volume Spike
    if len(volumes) >= 10:
        avg_volume = sum(volumes[-10:-1]) / 9
        if volume > avg_volume * 1.5:
            signals.append(f"Volume Spike (Volume actuel: {volume:.2f} > Moyenne: {avg_volume:.2f})")
            confidence = "Élevée"
    
    # Bollinger Band Squeeze
    if bandwidth < 0.05:
        signals.append("Bollinger Band Squeeze (Volatilité très faible, mouvement imminent)")
        confidence = "Élevée"
    
    # Bollinger Band Breakout
    if price > upper_band:
        signals.append(f"Bollinger Band Breakout (Prix ${price:.2f} > Bande sup ${upper_band:.2f})")
        confidence = "Très Élevée"
        signal_type = "BREAKOUT"
    elif price < lower_band:
        signals.append(f"Bollinger Band Breakdown (Prix ${price:.2f} < Bande inf ${lower_band:.2f})")
    
    # RSI
    if rsi < 30:
        signals.append(f"RSI < 30 (Oversold: {rsi:.1f}, potentiel de rebond)")
        confidence = "Élevée"
    elif rsi > 70:
        signals.append(f"RSI > 70 (Overbought: {rsi:.1f}, potentiel de correction)")
    
    # Changement 24h significatif
    if abs(change_24h) > 5:
        direction = "hausse" if change_24h > 0 else "baisse"
        signals.append(f"Mouvement 24h: {change_24h:+.2f}% ({direction} significative)")
        if change_24h > 10:
            confidence = "Très Élevée"
    
    # Générer une alerte seulement si au moins 2 signaux sont détectés
    if len(signals) >= 2:
        recommendation = "Achat immédiat pour scalping/day trading (forte probabilité de mouvement rapide)"
        if confidence == "Très Élevée":
            recommendation = "🚀 ACHAT IMMÉDIAT - Confirmation de Démarrage de Pump!"
        
        return {
            'timestamp': datetime.now(),
            'asset': symbol,
            'price': f"{price:.8f}" if price < 1 else f"{price:.2f}",
            'signalType': signal_type,
            'confidence': confidence,
            'recommendation': recommendation,
            'indicatorsTriggered': json.dumps(signals)
        }
    
    return None

def insert_alerts(alerts):
    """Insère les alertes dans la base de données."""
    if not alerts:
        print("Aucune alerte à insérer.")
        return True
    
    connection = create_connection()
    
    if connection is None:
        print("Impossible de se connecter à la base de données.")
        return False
    
    try:
        cursor = connection.cursor()
        
        insert_query = """
        INSERT INTO alerts (timestamp, asset, price, signalType, confidence, recommendation, indicatorsTriggered)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        for alert in alerts:
            cursor.execute(insert_query, (
                alert['timestamp'],
                alert['asset'],
                alert['price'],
                alert['signalType'],
                alert['confidence'],
                alert['recommendation'],
                alert['indicatorsTriggered']
            ))
        
        connection.commit()
        print(f"✅ {len(alerts)} alertes insérées avec succès dans la base de données.")
        return True
        
    except Error as e:
        print(f"Erreur lors de l'insertion des alertes: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("🚀 Génération d'alertes de trading basées sur Polygon.io...")
    
    # Analyser chaque coin
    alerts = []
    for symbol, ticker in TICKER_MAP.items():
        print(f"📊 Analyse de {symbol} ({ticker})...")
        market_data = fetch_market_data(ticker, days=7)
        if market_data:
            alert = analyze_coin(symbol, ticker, market_data)
            if alert:
                alerts.append(alert)
                print(f"  ✓ Alerte générée: {alert['confidence']} - {len(json.loads(alert['indicatorsTriggered']))} signaux")
            else:
                print(f"  ✗ Aucun signal significatif détecté")
        else:
            print(f"  ✗ Impossible de récupérer les données")
    
    # Insérer les alertes
    if alerts:
        insert_alerts(alerts)
    else:
        print("ℹ️  Aucune opportunité de trading détectée pour le moment.")
