import requests
import time
import random

URL = "http://127.0.0.1:5000/predict"

print("🚀 Lancement du flux de données AltScore (PD + Montants)...")

for i in range(40):
    client_id = f"Client_{random.randint(1, 7)}"
    # Ratio > 1 (mauvais signal), < 1 (bon signal)
    likelihood = random.uniform(0.5, 2.0) 
    # Montant emprunté entre 1000€ et 10000€
    loan_amount = random.randint(1000, 10000) 
    
    payload = {
        "id": client_id, 
        "likelihood": likelihood,
        "amount": loan_amount
    }
    
    try:
        res = requests.post(URL, json=payload)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ {client_id} | Prêt: {loan_amount}€ | Risque calculé: {data['new_pd']}%")
        else:
            print(f"❌ Erreur Serveur: {res.status_code}")
    except Exception as e:
        print(f"⚠️ Erreur de connexion: {e}")
    
    time.sleep(1)

print("\n✅ Simulation terminée. Tu peux consulter ton dashboard !")