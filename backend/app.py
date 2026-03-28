from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import numpy as np
import random

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client.AltScoreDB
transactions = db.transactions

PRIOR_PD = 0.10
L0 = np.log(PRIOR_PD / (1 - PRIOR_PD))
VAR_THRESHOLD = 50000 

def calculate_new_pd(previous_pd, likelihood_ratio):
    prior_odds = previous_pd / (1 - previous_pd)
    posterior_odds = prior_odds * likelihood_ratio
    return posterior_odds / (1 + posterior_odds)

def calculate_monte_carlo_var(clients_summary):
    if not clients_summary: return 0
    num_scenarios = 10000
    total_losses = []
    for _ in range(num_scenarios):
        scenario_loss = 0
        for c in clients_summary:
            if np.random.uniform(0, 1) < c['last_pd']:
                scenario_loss += c['amount']
        total_losses.append(scenario_loss)
    return np.percentile(total_losses, 99)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    client_id = data.get('id')
    likelihood = data.get('likelihood')
    amount = data.get('amount', 0)
    
    sources = ["Facture Telco", "Virement Crypto", "Log Connexion", "E-commerce"]
    signal_source = random.choice(sources)

    last_tx = transactions.find_one({"client_id": client_id}, sort=[("timestamp", -1)])
    current_pd = last_tx['probability_of_default'] if last_tx else PRIOR_PD
    new_pd = calculate_new_pd(current_pd, likelihood)
    
    # Audit Trail
    log_odds = np.log(new_pd / (1 - new_pd))
    expected_loss = new_pd * amount

    new_doc = {
        "client_id": client_id,
        "probability_of_default": float(new_pd),
        "likelihood_ratio": float(likelihood),
        "loan_amount": amount,
        "audit_trail": {
            "log_odds": round(float(log_odds), 2),
            "expected_loss": round(float(expected_loss), 2)
        },
        "signal_metadata": { "source": signal_source },
        "timestamp": datetime.now()
    }
    transactions.insert_one(new_doc)
    return jsonify({"status": "success", "new_pd": round(new_pd * 100, 2)})

@app.route('/portfolio-stats', methods=['GET'])
def get_stats():
    history = list(transactions.find({}, {"_id": 0}).sort("timestamp", -1).limit(100))
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$client_id", 
            "last_pd": {"$first": "$probability_of_default"}, 
            "amount": {"$first": "$loan_amount"}
        }}
    ]
    clients_summary = list(transactions.aggregate(pipeline))
    current_var = calculate_monte_carlo_var(clients_summary)
    return jsonify({
        "history": history[::-1],
        "current_var": round(current_var, 2),
        "total_loans": sum(c['amount'] for c in clients_summary),
        "threshold": VAR_THRESHOLD
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)