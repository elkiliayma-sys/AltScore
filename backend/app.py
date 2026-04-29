from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
import secrets

from core.scoring_engine import BayesianScorer
from core.risk_analysis   import RiskAnalyzer
from core.preprocessor    import DataCleaner
from database.mongo_handler import MongoManager
from routes.lender import lender_bp
from routes.auth   import auth_bp
from routes.rates  import rates_bp, calculate_rates

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

app.register_blueprint(lender_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(rates_bp)

db_manager = MongoManager()

PRIOR_PD      = 0.10
LGD_MAP = {
    "Immobilier":    0.20,
    "Automobile":    0.50,
    "Consommation":  1.00,
    "Micro-credit":  1.00,
    "Etudiant":      0.90,
    "Professionnel": 0.70
}
VAR_THRESHOLD    = 500000
THRESHOLD_ACCEPT = 0.15
THRESHOLD_REVIEW = 0.30

risk_analyzer = RiskAnalyzer()
cleaner       = DataCleaner()


def get_decision(pd):
    if pd < THRESHOLD_ACCEPT: return {"label": "ACCEPT", "color": "green"}
    elif pd < THRESHOLD_REVIEW: return {"label": "REVIEW", "color": "orange"}
    else: return {"label": "REJECT", "color": "red"}


@app.route('/client', methods=['POST'])
def create_client():
    data        = request.json
    client_id   = data.get('id')
    amount      = data.get('amount', 1000)
    revenus     = data.get('revenus', 0)
    deja_credit = data.get('deja_credit', False)
    loan_type   = data.get('loan_type', 'Consommation')
    months      = int(data.get('months', 24))
    type_taux   = data.get('type_taux', 'simple')

    if db_manager.get_history(client_id):
        return jsonify({"status": "exists", "message": f"{client_id} already exists."})

    initial_pd = PRIOR_PD
    if revenus > 4000:   initial_pd -= 0.03
    elif revenus < 1200: initial_pd += 0.05
    if deja_credit:      initial_pd -= 0.02
    initial_pd  = max(0.01, min(0.99, initial_pd))
    current_lgd = LGD_MAP.get(loan_type, 1.0)
    scorer      = BayesianScorer(initial_pd)
    rates       = calculate_rates(initial_pd, amount, months, type_taux)
    decision    = get_decision(initial_pd)

    # ── Document transaction (historique signaux) ────────────────
    doc = {
        "client_id": client_id, "loan_type": loan_type,
        "probability_of_default": float(initial_pd),
        "likelihood_ratio": 1.0, "loan_amount": amount,
        "client_info": {
            "age": data.get('age'), "situation": data.get('situation'),
            "enfants": data.get('enfants', 0), "revenus": revenus,
            "metier": data.get('metier'), "deja_credit": deja_credit
        },
        "lgd": current_lgd, "event_type": "Ouverture du dossier",
        "rates": rates,
        "audit_trail": {
            "log_odds":      round(float(scorer.log_odds), 4),
            "expected_loss": round(float(initial_pd * amount * current_lgd), 2),
            "amount_log":    round(float(cleaner.log_transform(amount)), 4),
        },
        "decision": decision["label"], "timestamp": datetime.now()
    }
    db_manager.save_transaction(doc)

    # ── Profil emprunteur enrichi (nouvelle collection borrowers) ─
    borrower_profile = {
        "borrower_id":   client_id,
        "loan_type":     loan_type,
        "loan_amount":   amount,
        "duree_mois":    months,
        "type_taux":     type_taux,
        "status":        decision["label"],   # ACCEPT / REVIEW / REJECT
        "pd_initial":    round(initial_pd * 100, 2),
        "taux_final":    rates["taux_total"],
        "taux_preteur":  rates["taux_preteur"],
        "taux_plateforme": rates["taux_plateforme"],
        "mensualite":    rates["mensualite"],
        "cout_total":    rates["cout_total"],
        "funded_by":     None,
        "funded_amount": None,
        "funded_at":     None,
        "client_info": {
            "age": data.get('age'), "situation": data.get('situation'),
            "enfants": data.get('enfants', 0), "revenus": revenus,
            "metier": data.get('metier'), "deja_credit": deja_credit
        },
        "created_at": datetime.now()
    }
    db_manager.save_borrower_profile(borrower_profile)

    return jsonify({
        "status": "created", "client_id": client_id,
        "initial_pd": round(initial_pd * 100, 2),
        "decision": decision["label"],
        "rates": rates
    })


@app.route('/borrower/<borrower_id>/profile', methods=['GET'])
def get_borrower_profile(borrower_id):
    profile = db_manager.get_borrower_profile(borrower_id)
    if not profile:
        return jsonify({"error": "Profil introuvable"}), 404
    return jsonify(profile)


@app.route('/predict', methods=['POST'])
def predict():
    data        = request.json
    client_id   = data.get('id')
    likelihood  = data.get('likelihood')
    amount      = data.get('amount', 0)
    revenus     = data.get('revenus', 0)
    deja_credit = data.get('deja_credit', False)
    event_type  = data.get('event_type', 'Unknown event')
    loan_type   = data.get('loan_type', 'Consommation')
    months      = int(data.get('months', 24))
    type_taux   = data.get('type_taux', 'simple')

    prior_pd = PRIOR_PD
    if revenus > 4000:   prior_pd -= 0.03
    elif revenus < 1200: prior_pd += 0.05
    if deja_credit:      prior_pd -= 0.02
    prior_pd = max(0.01, min(0.99, prior_pd))

    current_lgd = LGD_MAP.get(loan_type, 1.0)
    history     = db_manager.get_history(client_id)
    current_pd  = sorted(history, key=lambda x: x['timestamp'])[-1]['probability_of_default'] if history else prior_pd

    scorer        = BayesianScorer(prior_pd=current_pd)
    new_pd        = scorer.update_score(likelihood)
    expected_loss = new_pd * amount * current_lgd
    decision      = get_decision(new_pd)
    rates         = calculate_rates(new_pd, amount, months, type_taux)

    doc = {
        "client_id": client_id, "loan_type": loan_type,
        "probability_of_default": float(new_pd),
        "likelihood_ratio": float(likelihood), "loan_amount": amount,
        "client_info": {
            "age": data.get('age'), "situation": data.get('situation'),
            "enfants": data.get('enfants'), "revenus": revenus,
            "metier": data.get('metier'), "deja_credit": deja_credit
        },
        "lgd": current_lgd, "event_type": event_type, "rates": rates,
        "audit_trail": {
            "log_odds":      round(float(scorer.log_odds), 4),
            "expected_loss": round(float(expected_loss), 2),
            "amount_log":    round(float(cleaner.log_transform(amount)), 4),
        },
        "decision": decision["label"], "timestamp": datetime.now()
    }
    db_manager.save_transaction(doc)

    # Mettre à jour le statut dans borrowers
    db_manager.update_borrower_status(client_id, decision["label"])

    return jsonify({
        "status": "success", "new_pd": round(new_pd * 100, 2),
        "decision": decision, "rates": rates
    })


@app.route('/add-signal', methods=['POST'])
def add_custom_signal():
    data       = request.json
    client_id  = data.get('client_id')
    event_type = data.get('event_type', 'Action Manuelle')
    likelihood = float(data.get('likelihood', 1.0))

    history = db_manager.get_history(client_id)
    if not history:
        return jsonify({"error": "Client introuvable"}), 404

    last_doc    = sorted(history, key=lambda x: x['timestamp'])[-1]
    scorer      = BayesianScorer(prior_pd=last_doc['probability_of_default'])
    new_pd      = scorer.update_score(likelihood)
    amount      = last_doc.get('loan_amount', 0)
    current_lgd = last_doc.get('lgd', 1.0)
    decision    = get_decision(new_pd)
    months      = last_doc.get('rates', {}).get('duree_mois', 24)
    type_taux   = last_doc.get('rates', {}).get('type_taux', 'simple')
    rates       = calculate_rates(new_pd, amount, months, type_taux)

    doc = {
        "client_id": client_id,
        "loan_type": last_doc.get('loan_type', 'Consommation'),
        "probability_of_default": float(new_pd),
        "likelihood_ratio": float(likelihood), "loan_amount": amount,
        "client_info": last_doc.get('client_info', {}),
        "lgd": current_lgd, "event_type": f"MANUEL: {event_type}", "rates": rates,
        "audit_trail": {
            "log_odds":      round(float(scorer.log_odds), 4),
            "expected_loss": round(float(new_pd * amount * current_lgd), 2),
            "amount_log":    round(float(cleaner.log_transform(amount)), 4),
        },
        "decision": decision["label"], "timestamp": datetime.now()
    }
    db_manager.save_transaction(doc)
    db_manager.update_borrower_status(client_id, decision["label"])

    return jsonify({"status": "success", "new_pd": round(new_pd * 100, 2), "rates": rates})


@app.route('/portfolio-stats', methods=['GET'])
def get_stats():
    all_history        = db_manager.get_history()
    all_history_sorted = sorted(all_history, key=lambda x: x['timestamp'])

    clients_map = {}
    for tx in all_history_sorted:
        clients_map[tx['client_id']] = tx
    clients_summary = list(clients_map.values())

    pd_list         = [c['probability_of_default'] for c in clients_summary]
    ead_list        = [c['loan_amount'] for c in clients_summary]
    current_var     = risk_analyzer.calculate_var_portfolio(pd_list, ead_list, lgd=1.0)
    total_loans     = sum(c['loan_amount'] for c in clients_summary)
    circuit_breaker = current_var >= VAR_THRESHOLD
    platform_revenue = sum(c.get('rates', {}).get('gain_plateforme', 0) for c in clients_summary)

    return jsonify({
        "history":          all_history_sorted[-100:],
        "current_var":      round(current_var, 2),
        "total_loans":      total_loans,
        "threshold":        VAR_THRESHOLD,
        "circuit_breaker":  circuit_breaker,
        "nb_clients":       len(clients_summary),
        "platform_revenue": round(platform_revenue, 2)
    })


if __name__ == '__main__':
    app.run(port=5000, debug=True)