import time
import sys

def simulate_load(num_pairs, updates_per_sec_per_pair):
    """
    Simule la charge CPU et mémoire pour le traitement de flux WebSocket
    """
    total_updates_per_sec = num_pairs * updates_per_sec_per_pair
    
    # Estimation empirique basée sur Node.js WebSocket handling
    # ~0.5KB RAM par paire active (buffer + state)
    # ~0.01% CPU par update/sec (traitement JSON + logique simple)
    
    base_ram_mb = 150 # Node.js runtime base
    ram_per_pair_mb = 2 # Structure de données + historique bougies
    
    total_ram_mb = base_ram_mb + (num_pairs * ram_per_pair_mb)
    
    # CPU Core usage (100% = 1 core)
    # Traitement JSON parsing + Indicators calculation
    cpu_usage_percent = total_updates_per_sec * 0.05 
    
    return {
        "pairs": num_pairs,
        "updates_sec": total_updates_per_sec,
        "ram_mb": total_ram_mb,
        "cpu_cores": cpu_usage_percent / 100
    }

# Simulation pour 100 paires
result = simulate_load(100, 2) # 2 updates/sec moyenne (marché calme/actif mix)

print(f"--- Simulation Charge Serveur (Top {result['pairs']}) ---")
print(f"Flux total : {result['updates_sec']} messages/seconde")
print(f"RAM estimée : {result['ram_mb']} MB")
print(f"CPU estimé : {result['cpu_cores']:.2f} vCPU")
