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
    # --- FLUX FINANCIERS (Signaux Forts) ---
    {"type": "Paiement facture telco à temps",   "likelihood": 0.4},
    {"type": "Virement entrant régulier",         "likelihood": 0.3},
    {"type": "Remboursement anticipé",            "likelihood": 0.2},
    {"type": "Solde compte stable 30j",           "likelihood": 0.5},
    {"type": "Retard facture telco",              "likelihood": 1.8},
    {"type": "Découvert bancaire détecté",        "likelihood": 2.0},
    {"type": "Absence de revenus 30j",            "likelihood": 1.9},
    {"type": "Rejet de prélèvement automatique",  "likelihood": 2.2},
    {"type": "Augmentation soudaine de l'épargne","likelihood": 0.6},

    # --- COMPORTEMENT NUMÉRIQUE & WEB (Signaux Faibles / Alternatifs) ---
    {"type": "Connexion nocturne inhabituelle",   "likelihood": 1.3},
    {"type": "Changement d'adresse IP",           "likelihood": 1.0},
    {"type": "Mise à jour profil application",    "likelihood": 1.0},
    {"type": "Utilisation VPN suspecte",          "likelihood": 1.2},
    {"type": "Vitesse de saisie formulaire élevée","likelihood": 0.8}, # Indique un utilisateur habitué/réel
    {"type": "Plusieurs tentatives mdp erroné",   "likelihood": 1.4},

    # --- ÉCOSYSTÈME CRYPTO & TECH ---
    {"type": "Transaction crypto volume élevé",   "likelihood": 1.5},
    {"type": "Dépôt sur plateforme Exchange",     "likelihood": 1.1},
    {"type": "Plus-value crypto réalisée",        "likelihood": 0.7},

    # --- SOCIAL & MOBILE (Données Telco avancées) ---
    {"type": "Appels vers l'étranger fréquents",  "likelihood": 1.1},
    {"type": "Recharge crédit mobile (Top-up)",   "likelihood": 0.9},
    {"type": "Changement fréquent de carte SIM",  "likelihood": 1.7},
    {"type": "Stabilité géographique (Domicile)", "likelihood": 0.8},

    # --- ÉVÉNEMENTS DE VIE / DOSSIER ---
    {"type": "Demande de nouveau prêt ailleurs",  "likelihood": 1.6},
    {"type": "Récupération de bonus fidélité",    "likelihood": 0.9},
    {"type": "Contact service client (Plainte)",  "likelihood": 1.05},
    {"type": "Contact service client (Info)",     "likelihood": 1.0},
]

# 7 clients fictifs avec des montants de prêt fixés
CLIENTS = [
    {
        "id": "Client_1", 
        "loan_amount": 2000, "loan_type": "Consommation",
        "age": 28, "situation": "Célibataire", "enfants": 0, "revenus": 1800, "metier": "Vendeur", "deja_credit": False
    },
    {
        "id": "Client_2", 
        "loan_amount": 15000, "loan_type": "Automobile",
        "age": 35, "situation": "Marié", "enfants": 2, "revenus": 2400, "metier": "Infirmier", "deja_credit": True
    },
    {
        "id": "Client_3", 
        "loan_amount": 1500, "loan_type": "Micro-crédit",
        "age": 22, "situation": "Célibataire", "enfants": 0, "revenus": 1200, "metier": "Freelance", "deja_credit": False
    },
    {
        "id": "Client_4", 
        "loan_amount": 250000, "loan_type": "Immobilier",
        "age": 45, "situation": "Marié", "enfants": 2, "revenus": 5500, "metier": "Ingénieur", "deja_credit": True
    },
    {
        "id": "Client_5", 
        "loan_amount": 3000, "loan_type": "Étudiant",
        "age": 20, "situation": "Célibataire", "enfants": 0, "revenus": 600, "metier": "Étudiant", "deja_credit": False
    },
    {
        "id": "Client_6", 
        "loan_amount": 10000, "loan_type": "Professionnel",
        "age": 39, "situation": "Divorcé", "enfants": 1, "revenus": 3200, "metier": "Artisan", "deja_credit": True
    },
    {
        "id": "Client_7", 
        "loan_amount": 4500, "loan_type": "Consommation",
        "age": 55, "situation": "Marié", "enfants": 3, "revenus": 4000, "metier": "Cadre", "deja_credit": False
    },
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
        "amount":       client["loan_amount"],
        "loan_type":    client["loan_type"],
        "age": client["age"],
        "situation": client["situation"],
        "enfants": client["enfants"],
        "revenus": client["revenus"],
        "metier": client["metier"],
        "deja_credit": client["deja_credit"]
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