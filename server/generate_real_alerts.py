#!/usr/bin/env python3
"""
Script de génération d'alertes de trading basé sur les vraies données de l'API CoinGecko.
"""

import sys
import os
import json
import requests
from datetime import datetime
import mysql.connector
from mysql.connector import Error
from urllib.parse import urlparse, parse_qs

# Récupération de la DATABASE_URL depuis l'environnement
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("Erreur: DATABASE_URL n'est pas défini dans l'environnement.")
    sys.exit(1)

# Parse DATABASE_URL
try:
    parsed = urlparse(DATABASE_URL)
    
    username = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port if parsed.port else 3306
    database = parsed.path.lstrip('/')
    
    # Configuration SSL
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

# Configuration de l'API CoinGecko
COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

COIN_MAP = {
    'BTC-USD': 'bitcoin',
    'ETH-USD': 'ethereum',
    'PEPE-USD': 'pepe',
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

def fetch_market_data():
    """Récupère les données de marché depuis l'API CoinGecko."""
    try:
        coin_ids = ','.join(COIN_MAP.values())
        url = f"{COINGECKO_API_BASE}/simple/price"
        params = {
            'ids': coin_ids,
            'vs_currencies': 'usd',
            'include_market_cap': 'true',
            'include_24hr_vol': 'true',
            'include_24hr_change': 'true',
            'include_last_updated_at': 'true'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f"Erreur lors de la récupération des données de marché: {e}")
        return None

def fetch_ohlc_data(coin_id, days=1):
    """Récupère les données OHLC pour un coin."""
    try:
        url = f"{COINGECKO_API_BASE}/coins/{coin_id}/ohlc"
        params = {
            'vs_currency': 'usd',
            'days': str(days)
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f"Erreur lors de la récupération des données OHLC pour {coin_id}: {e}")
        return None

def calculate_rsi(prices, period=14):
    """Calcule le RSI."""
    if len(prices) < period + 1:
        return 50  # Valeur neutre par défaut
    
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

def analyze_coin(symbol, coin_id, market_data):
    """Analyse un coin et génère une alerte si nécessaire."""
    coin_data = market_data.get(coin_id)
    if not coin_data:
        return None
    
    price = coin_data.get('usd', 0)
    volume_24h = coin_data.get('usd_24h_vol', 0)
    change_24h = coin_data.get('usd_24h_change', 0)
    
    # Récupérer les données OHLC
    ohlc_data = fetch_ohlc_data(coin_id, days=1)
    if not ohlc_data or len(ohlc_data) < 10:
        return None
    
    # Extraire les prix de clôture
    close_prices = [candle[4] for candle in ohlc_data]
    
    # Calculer le RSI
    rsi = calculate_rsi(close_prices)
    
    # Calculer les Bollinger Bands (simplifié)
    period = min(20, len(close_prices))
    recent_prices = close_prices[-period:]
    sma = sum(recent_prices) / period
    variance = sum((p - sma) ** 2 for p in recent_prices) / period
    std_dev = variance ** 0.5
    upper_band = sma + (2 * std_dev)
    lower_band = sma - (2 * std_dev)
    bandwidth = (upper_band - lower_band) / sma if sma > 0 else 0
    
    # Détection des signaux
    signals = []
    confidence = "Moyenne"
    signal_type = "PRE_PUMP_VOLATILITY"
    
    # Volume Spike (volume actuel > 1.5x la moyenne historique)
    if len(ohlc_data) > 1:
        avg_volume = volume_24h  # Simplification
        if volume_24h > avg_volume * 1.5:
            signals.append(f"Volume Spike (Volume élevé: ${volume_24h/1e6:.2f}M)")
            confidence = "Élevée"
    
    # Bollinger Band Squeeze
    if bandwidth < 0.05:
        signals.append("Bollinger Band Squeeze (Volatilité très faible, mouvement imminent)")
        confidence = "Élevée"
    
    # Bollinger Band Breakout
    if price > upper_band:
        signals.append("Bollinger Band Breakout (Le prix a cassé la bande supérieure)")
        confidence = "Très Élevée"
        signal_type = "BREAKOUT"
    elif price < lower_band:
        signals.append("Bollinger Band Breakdown (Le prix a cassé la bande inférieure)")
    
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
            recommendation = "Achat immédiat (Confirmation de Démarrage de Pump)"
        
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
    print("🚀 Génération d'alertes de trading basées sur les données réelles...")
    
    # Récupérer les données de marché
    market_data = fetch_market_data()
    if not market_data:
        print("❌ Impossible de récupérer les données de marché.")
        sys.exit(1)
    
    # Analyser chaque coin
    alerts = []
    for symbol, coin_id in COIN_MAP.items():
        print(f"📊 Analyse de {symbol}...")
        alert = analyze_coin(symbol, coin_id, market_data)
        if alert:
            alerts.append(alert)
            print(f"  ✓ Alerte générée: {alert['confidence']} - {len(json.loads(alert['indicatorsTriggered']))} signaux")
        else:
            print(f"  ✗ Aucun signal significatif détecté")
    
    # Insérer les alertes
    if alerts:
        insert_alerts(alerts)
    else:
        print("ℹ️  Aucune opportunité de trading détectée pour le moment.")
