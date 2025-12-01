#!/usr/bin/env python3
"""
Script pour générer des trades de test réalistes basés sur un capital initial de 50€
et une stratégie de trading à court terme visant 20-30% de gains par trade.
"""

import os
import sys
import random
from datetime import datetime, timedelta
import mysql.connector
from urllib.parse import urlparse, parse_qs

def parse_database_url(database_url):
    """Parse la DATABASE_URL pour extraire les informations de connexion"""
    parsed = urlparse(database_url)
    
    # Extraire les paramètres de la query string
    query_params = parse_qs(parsed.query)
    
    config = {
        'host': parsed.hostname,
        'port': parsed.port or 3306,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path.lstrip('/'),
        'ssl_ca': None,  # Accepter tous les certificats SSL
        'ssl_verify_cert': False,
        'ssl_verify_identity': False,
    }
    
    return config

def generate_test_trades():
    """Génère des trades de test réalistes"""
    
    # Récupérer la DATABASE_URL depuis les variables d'environnement
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment variables", file=sys.stderr)
        return
    
    try:
        # Parser l'URL de la base de données
        db_config = parse_database_url(database_url)
        
        # Connexion à la base de données
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Capital initial
        capital = 50.0
        
        # Actifs disponibles
        assets = ["BTC-USD", "ETH-USD", "PEPE-USD"]
        
        # Générer 30 trades sur les 30 derniers jours
        trades_data = []
        current_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            # Choisir un actif aléatoire
            asset = random.choice(assets)
            
            # Prix d'entrée simulé (basé sur les prix actuels approximatifs)
            if asset == "BTC-USD":
                entry_price = random.uniform(85000, 95000)
            elif asset == "ETH-USD":
                entry_price = random.uniform(2800, 3200)
            else:  # PEPE-USD
                entry_price = random.uniform(0.000015, 0.000025)
            
            # Quantité basée sur le capital disponible (investir tout le capital)
            quantity = capital / entry_price
            
            # Simuler un gain ou une perte (70% de chances de gain, 30% de perte)
            is_win = random.random() < 0.7
            
            if is_win:
                # Gain entre 15% et 35%
                profit_percent = random.uniform(15, 35)
            else:
                # Perte entre -5% et -15%
                profit_percent = random.uniform(-15, -5)
            
            # Calculer le prix de sortie
            exit_price = entry_price * (1 + profit_percent / 100)
            
            # Calculer le profit en USD
            profit = (exit_price - entry_price) * quantity
            
            # Mettre à jour le capital
            capital += profit
            
            # Temps d'entrée et de sortie (trade de quelques heures)
            entry_time = current_date + timedelta(hours=random.randint(0, 23))
            exit_time = entry_time + timedelta(hours=random.randint(2, 12))
            
            trades_data.append({
                'asset': asset,
                'entry_price': f"{entry_price:.8f}",
                'exit_price': f"{exit_price:.8f}",
                'quantity': f"{quantity:.8f}",
                'profit': f"{profit:.2f}",
                'profit_percent': f"{profit_percent:.2f}",
                'status': 'closed',
                'entry_time': entry_time.strftime('%Y-%m-%d %H:%M:%S'),
                'exit_time': exit_time.strftime('%Y-%m-%d %H:%M:%S'),
                'notes': f"Trade {'gagnant' if is_win else 'perdant'} ({profit_percent:+.2f}%)"
            })
            
            # Avancer d'un jour
            current_date += timedelta(days=1)
        
        # Insérer les trades dans la base de données
        insert_query = """
        INSERT INTO trades (asset, entryPrice, exitPrice, quantity, profit, profitPercent, status, entryTime, exitTime, notes)
        VALUES (%(asset)s, %(entry_price)s, %(exit_price)s, %(quantity)s, %(profit)s, %(profit_percent)s, %(status)s, %(entry_time)s, %(exit_time)s, %(notes)s)
        """
        
        cursor.executemany(insert_query, trades_data)
        conn.commit()
        
        print(f"✅ {len(trades_data)} trades de test générés avec succès!")
        print(f"💰 Capital initial: 50.00€")
        print(f"💰 Capital final: {capital:.2f}€")
        print(f"📈 ROI: {((capital - 50) / 50 * 100):.2f}%")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_test_trades()
