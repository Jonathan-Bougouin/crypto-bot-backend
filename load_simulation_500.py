import sys
import time
import random

# Simulation de charge pour 500 paires
# Hypothèses :
# - Chaque paire envoie 1 update par seconde en moyenne (marché actif)
# - Taille moyenne d'un message WebSocket : 256 bytes
# - Traitement par message : 0.1ms de CPU
# - Mémoire par paire (historique + indicateurs) : 5 MB

PAIRS_COUNT = 500
MSG_SIZE_BYTES = 256
CPU_TIME_PER_MSG_MS = 0.1
MEMORY_PER_PAIR_MB = 5

def simulate_load():
    print(f"🚀 Simulation de charge pour {PAIRS_COUNT} paires crypto (Top 500)")
    print("-" * 50)
    
    # 1. Estimation Mémoire (RAM)
    # Base Node.js overhead : ~50MB
    # Data structures per pair : 5MB (Order book + Candles + Indicators)
    total_memory_mb = 50 + (PAIRS_COUNT * MEMORY_PER_PAIR_MB)
    
    print(f"💾 Mémoire RAM estimée :")
    print(f"   - Base Overhead : 50 MB")
    print(f"   - Données Paires ({PAIRS_COUNT} x {MEMORY_PER_PAIR_MB}MB) : {PAIRS_COUNT * MEMORY_PER_PAIR_MB} MB")
    print(f"   = TOTAL RAM : {total_memory_mb} MB ({total_memory_mb/1024:.2f} GB)")
    
    # 2. Estimation CPU
    # Messages par seconde (Total)
    msgs_per_sec = PAIRS_COUNT * 1.5 # 1.5 updates/sec avg volatility
    cpu_time_needed_ms = msgs_per_sec * CPU_TIME_PER_MSG_MS
    
    # 1 seconde = 1000ms. Si on a besoin de >1000ms, on sature 1 coeur.
    cpu_usage_percent = (cpu_time_needed_ms / 1000) * 100
    
    print(f"\n⚡ Charge CPU estimée :")
    print(f"   - Messages/sec (Global) : {msgs_per_sec}")
    print(f"   - Temps traitement requis : {cpu_time_needed_ms:.2f} ms/sec")
    print(f"   = Usage CPU (1 Core) : {cpu_usage_percent:.2f}%")
    
    # 3. Bande Passante
    bandwidth_kbps = (msgs_per_sec * MSG_SIZE_BYTES) / 1024
    bandwidth_mbps = bandwidth_kbps / 1024 * 8 # Mbps
    
    print(f"\n🌐 Bande Passante estimée :")
    print(f"   - Débit : {bandwidth_kbps:.2f} KB/s")
    print(f"   - Débit : {bandwidth_mbps:.2f} Mbps")
    
    # 4. Limites API Coinbase
    # WebSocket : Max 5 connexions par IP, mais 1 connexion peut souscrire à ~300 paires.
    # Donc il faut 2 connexions WebSocket parallèles.
    print(f"\n🚧 Contraintes API Coinbase :")
    print(f"   - Connexions WS nécessaires : {PAIRS_COUNT / 300:.1f} -> 2 connexions")
    print(f"   - Risque Rate Limit REST (pour l'historique) : ÉLEVÉ au démarrage")
    
    return {
        "ram_gb": total_memory_mb / 1024,
        "cpu_percent": cpu_usage_percent,
        "bandwidth_mbps": bandwidth_mbps
    }

if __name__ == "__main__":
    simulate_load()
