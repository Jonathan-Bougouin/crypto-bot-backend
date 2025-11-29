#!/usr/bin/env python3
"""
Script de génération d'alertes de trading pour le Crypto Alert Dashboard.
Ce script simule la détection de signaux de pré-pump et stocke les alertes dans la base de données.
"""

import sys
import os
import json
from datetime import datetime
import mysql.connector
from mysql.connector import Error

# Récupération de la DATABASE_URL depuis l'environnement
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("Erreur: DATABASE_URL n'est pas défini dans l'environnement.")
    sys.exit(1)

# Parse DATABASE_URL (format: mysql://user:password@host:port/database?options)
try:
    from urllib.parse import urlparse, parse_qs
    
    # Parser l'URL
    parsed = urlparse(DATABASE_URL)
    
    username = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port if parsed.port else 3306
    database = parsed.path.lstrip('/')
    
    # Extraire les options SSL si présentes
    ssl_config = None
    if parsed.query and 'ssl' in parsed.query:
        # Configuration SSL simplifiée pour TiDB Cloud
        ssl_config = {
            'ssl_disabled': False,
            'ssl_verify_cert': False,  # Désactiver la vérification stricte pour éviter les problèmes de certificat
            'ssl_verify_identity': False
        }
        
except Exception as e:
    print(f"Erreur lors du parsing de DATABASE_URL: {e}")
    sys.exit(1)

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
        
        # Ajouter la configuration SSL si nécessaire
        if ssl_config:
            config.update(ssl_config)
        
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Erreur de connexion à MySQL: {e}")
        return None

def generate_sample_alerts():
    """Génère des alertes de trading simulées."""
    
    # Alertes simulées pour démonstration
    sample_alerts = [
        {
            "timestamp": datetime.now(),
            "asset": "BTC-USD",
            "price": "68500.00",
            "signalType": "PRE_PUMP_VOLATILITY",
            "confidence": "Élevée",
            "recommendation": "Achat immédiat pour scalping/day trading (forte probabilité de mouvement rapide)",
            "indicatorsTriggered": json.dumps([
                "Volume Spike (Volume 3500.00 > Moyenne 1200.00 * 2.0)",
                "Bollinger Band Squeeze (Volatilité très faible, mouvement imminent)"
            ])
        },
        {
            "timestamp": datetime.now(),
            "asset": "ETH-USD",
            "price": "3520.00",
            "signalType": "PRE_PUMP_VOLATILITY",
            "confidence": "Très Élevée",
            "recommendation": "Achat immédiat (Confirmation de Démarrage de Pump)",
            "indicatorsTriggered": json.dumps([
                "Volume Spike (Volume 4200.00 > Moyenne 1500.00 * 2.0)",
                "Bollinger Band Breakout (Le prix a cassé la bande supérieure)"
            ])
        },
        {
            "timestamp": datetime.now(),
            "asset": "PEPE-USD",
            "price": "0.000015",
            "signalType": "PRE_PUMP_VOLATILITY",
            "confidence": "Élevée",
            "recommendation": "Achat immédiat pour scalping/day trading (forte probabilité de mouvement rapide)",
            "indicatorsTriggered": json.dumps([
                "Volume Spike (Volume 5000.00 > Moyenne 1800.00 * 2.0)",
                "RSI < 30 (Oversold, potentiel de rebond)"
            ])
        }
    ]
    
    return sample_alerts

def insert_alerts(alerts):
    """Insère les alertes dans la base de données."""
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
    print("🚀 Génération d'alertes de trading...")
    alerts = generate_sample_alerts()
    insert_alerts(alerts)
