from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from core.scoring_engine import BayesianScorer
from core.risk_analysis   import RiskAnalyzer
from core.preprocessor    import DataCleaner
from database.mongo_handler import MongoManager

app = Flask(__name__)
CORS(app)

db_manager = MongoManager()

PRIOR_PD      = 0.10
LGD           = 1.0
VAR_THRESHOLD = 50000

THRESHOLD_ACCEPT = 0.15
THRESHOLD_REVIEW = 0.30

risk_analyzer = RiskAnalyzer()
cleaner       = DataCleaner()


def get_decision(pd: float) -> dict:
    if pd < THRESHOLD_ACCEPT:
        return {"label": "ACCEPT",  "color": "green"}
    elif pd < THRESHOLD_REVIEW:
        return {"label": "REVIEW",  "color": "orange"}
    else:
        return {"label": "REJECT",  "color": "red"}


@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    client_id    = data.get('id')
    likelihood   = data.get('likelihood')
    amount       = data.get('amount', 0)
    event_type   = data.get('event_type', 'Unknown event')

    amount_transformed = cleaner.log_transform(amount)

    history = db_manager.get_history(client_id)
    if history:
        history_sorted = sorted(history, key=lambda x: x['timestamp'])
        current_pd = history_sorted[-1]['probability_of_default']
    else:
        current_pd = PRIOR_PD

    scorer = BayesianScorer(prior_pd=current_pd)
    new_pd = scorer.update_score(likelihood)

    log_odds      = scorer.log_odds
    expected_loss = new_pd * amount * LGD
    decision      = get_decision(new_pd)

    doc = {
        "client_id":              client_id,
        "probability_of_default": float(new_pd),
        "likelihood_ratio":       float(likelihood),
        "loan_amount":            amount,
        "lgd":                    LGD,
        "event_type":             event_type,
        "audit_trail": {
            "log_odds":      round(float(log_odds), 4),
            "expected_loss": round(float(expected_loss), 2),
            "amount_log":    round(float(amount_transformed), 4),
        },
        "decision":   decision["label"],
        "timestamp":  datetime.now()
    }

    db_manager.save_transaction(doc)

    return jsonify({
        "status":     "success",
        "new_pd":     round(new_pd * 100, 2),
        "decision":   decision,
        "event_type": event_type
    })


@app.route('/portfolio-stats', methods=['GET'])
def get_stats():
    all_history = db_manager.get_history()
    all_history_sorted = sorted(all_history, key=lambda x: x['timestamp'])
    history = all_history_sorted[-100:]

    clients_map = {}
    for tx in all_history_sorted:
        clients_map[tx['client_id']] = tx

    clients_summary = list(clients_map.values())

    pd_list  = [c['probability_of_default'] for c in clients_summary]
    ead_list = [c['loan_amount'] for c in clients_summary]

    current_var     = risk_analyzer.calculate_var_portfolio(pd_list, ead_list, LGD)
    total_loans     = sum(c['loan_amount'] for c in clients_summary)
    circuit_breaker = current_var >= VAR_THRESHOLD

    return jsonify({
        "history":         history,
        "current_var":     round(current_var, 2),
        "total_loans":     total_loans,
        "threshold":       VAR_THRESHOLD,
        "circuit_breaker": circuit_breaker,
        "nb_clients":      len(clients_summary)
    })


@app.route('/client', methods=['POST'])
def create_client():
    data      = request.json
    client_id = data.get('id')
    amount    = data.get('amount', 1000)

    existing = db_manager.get_history(client_id)
    if existing:
        return jsonify({"status": "exists", "message": f"{client_id} already exists."})

    scorer = BayesianScorer(PRIOR_PD)
    doc = {
        "client_id":              client_id,
        "probability_of_default": PRIOR_PD,
        "likelihood_ratio":       1.0,
        "loan_amount":            amount,
        "lgd":                    LGD,
        "event_type":             "Profile creation",
        "audit_trail": {
            "log_odds":      round(float(scorer.log_odds), 4),
            "expected_loss": round(PRIOR_PD * amount * LGD, 2),
            "amount_log":    round(float(cleaner.log_transform(amount)), 4),
        },
        "decision":   get_decision(PRIOR_PD)["label"],
        "timestamp":  datetime.now()
    }
    db_manager.save_transaction(doc)

    return jsonify({"status": "created", "client_id": client_id, "initial_pd": PRIOR_PD * 100})


if __name__ == '__main__':
    app.run(port=5000, debug=True)
