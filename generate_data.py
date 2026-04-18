import requests
import time
import random

URL = "http://127.0.0.1:5000/predict"

# ─────────────────────────────────────────────────────────────────
# Catalogue des événements métier
# Chaque événement a :
#   - un nom lisible (affiché dans les logs et stocké en MongoDB)
#   - un likelihood_ratio FIXE basé sur la logique métier :
#       > 1 → signal négatif (risque augmente)
#       < 1 → signal positif (risque diminue)
# ─────────────────────────────────────────────────────────────────
EVENT_CATALOG = [
    # --- Signaux positifs (bon payeur) ---
    {"type": "Paiement facture telco à temps",   "likelihood": 0.4},
    {"type": "Virement entrant régulier",         "likelihood": 0.3},
    {"type": "Remboursement anticipé",            "likelihood": 0.2},
    {"type": "Solde compte stable 30j",           "likelihood": 0.5},

    # --- Signaux négatifs (risque de défaut) ---
    {"type": "Retard facture telco",              "likelihood": 1.8},
    {"type": "Connexion nocturne inhabituelle",   "likelihood": 1.3},
    {"type": "Transaction crypto volume élevé",   "likelihood": 1.5},
    {"type": "Découvert bancaire détecté",        "likelihood": 2.0},
    {"type": "Absence de revenus 30j",            "likelihood": 1.9},

    # --- Signaux neutres ---
    {"type": "Changement d'adresse IP",           "likelihood": 1.0},
    {"type": "Mise à jour profil application",    "likelihood": 1.0},
]

# 7 clients fictifs avec des montants de prêt fixés
CLIENTS = [
    {"id": "Client_1", "loan_amount": 2000},
    {"id": "Client_2", "loan_amount": 5000},
    {"id": "Client_3", "loan_amount": 1500},
    {"id": "Client_4", "loan_amount": 8000},
    {"id": "Client_5", "loan_amount": 3000},
    {"id": "Client_6", "loan_amount": 10000},
    {"id": "Client_7", "loan_amount": 4500},
]

print("Lancement du flux de données AltScore...")
print(f"{len(CLIENTS)} clients, {len(EVENT_CATALOG)} types d'événements disponibles\n")

for i in range(40):
    # Sélection aléatoire d'un client et d'un événement
    client  = random.choice(CLIENTS)
    event   = random.choice(EVENT_CATALOG)

    payload = {
        "id":           client["id"],
        "event_type":   event["type"],
        "likelihood":   event["likelihood"],
        "amount":       client["loan_amount"]
    }

    try:
        res = requests.post(URL, json=payload)
        if res.status_code == 200:
            data = res.json()
            direction = "▲ risque" if event["likelihood"] > 1 else ("▼ risque" if event["likelihood"] < 1 else "= neutre")
            print(
                f"[{i+1:02d}] {client['id']:10s} | "
                f"{event['type']:40s} | "
                f"ratio={event['likelihood']:.1f} ({direction}) | "
                f"PD={data['new_pd']}%"
            )
        else:
            print(f"Erreur serveur: {res.status_code}")
    except Exception as e:
        print(f"Erreur de connexion: {e}")

    time.sleep(0.5)  # réduit à 0.5s pour une démo plus rapide

print("\nSimulation terminée.")