from flask import Blueprint, request, jsonify
from database.mongo_handler import MongoManager
from datetime import datetime

lender_bp  = Blueprint('lender', __name__)
db_manager = MongoManager()


@lender_bp.route('/lender/register', methods=['POST'])
def register_lender():
    data      = request.json
    lender_id = data.get('lender_id')
    if not lender_id:
        return jsonify({"error": "lender_id obligatoire"}), 400

    if db_manager.get_lender(lender_id):
        return jsonify({"status": "exists", "message": f"{lender_id} existe deja."})

    doc = {
        "lender_id":         lender_id,
        "name":              data.get('name', lender_id),
        "capital_available": float(data.get('capital_available', 1000)),
        "risk_tolerance":    float(data.get('risk_tolerance', 0.15)),
        "preferences": {
            "loan_types": data.get('loan_types', ['Consommation']),
            "max_amount": float(data.get('max_amount', 5000)),
            "min_amount": float(data.get('min_amount', 500)),
        },
        "total_lent":    0,
        "active_loans":  0,
        "timestamp":     datetime.now()
    }
    db_manager.save_lender(doc)
    return jsonify({"status": "created", "lender_id": lender_id})


@lender_bp.route('/lenders', methods=['GET'])
def get_lenders():
    lenders = db_manager.get_all_lenders()
    return jsonify({"lenders": lenders, "count": len(lenders)})


@lender_bp.route('/match/<borrower_id>', methods=['GET'])
def match_borrower(borrower_id):
    history = db_manager.get_history(borrower_id)
    if not history:
        return jsonify({"error": "Emprunteur introuvable"}), 404

    borrower        = sorted(history, key=lambda x: x['timestamp'])[-1]
    borrower_pd     = borrower['probability_of_default']
    borrower_amount = borrower.get('loan_amount', 0)
    borrower_type   = borrower.get('loan_type', 'Consommation')
    borrower_decision = borrower.get('decision', 'REJECT')

    all_lenders = db_manager.get_all_lenders()
    matches     = []

    for lender in all_lenders:
        prefs = lender.get('preferences', {})

        # Criteres obligatoires
        if borrower_pd > lender['risk_tolerance']:        continue
        if lender['capital_available'] < borrower_amount: continue
        if borrower_amount > prefs.get('max_amount', float('inf')): continue
        if borrower_amount < prefs.get('min_amount', 0):            continue

        # Score de compatibilite
        score   = 50
        reasons = []

        if borrower_type in prefs.get('loan_types', []):
            score += 30
            reasons.append(f"Type '{borrower_type}' correspond aux preferences")

        margin = lender['risk_tolerance'] - borrower_pd
        score += int(margin * 100)
        reasons.append(f"Marge de securite : {round(margin * 100, 1)}%")

        if lender.get('active_loans', 0) > 0:
            score += 10
            reasons.append("Preteur actif")

        matches.append({
            "lender_id":           lender['lender_id'],
            "name":                lender.get('name', lender['lender_id']),
            "capital_available":   lender['capital_available'],
            "risk_tolerance":      round(lender['risk_tolerance'] * 100, 1),
            "compatibility_score": score,
            "reasons":             reasons,
            "loan_types":          prefs.get('loan_types', []),
            "max_amount":          prefs.get('max_amount', 0),
        })

    matches = sorted(matches, key=lambda x: x['compatibility_score'], reverse=True)

    return jsonify({
        "borrower_id":       borrower_id,
        "borrower_pd":       round(borrower_pd * 100, 2),
        "borrower_decision": borrower_decision,
        "loan_amount":       borrower_amount,
        "loan_type":         borrower_type,
        "matches":           matches,
        "nb_matches":        len(matches)
    })


@lender_bp.route('/lender/fund', methods=['POST'])
def fund_borrower():
    data        = request.json
    lender_id   = data.get('lender_id')
    borrower_id = data.get('borrower_id')
    amount      = float(data.get('amount', 0))

    lender = db_manager.get_lender(lender_id)
    if not lender:
        return jsonify({"error": "Preteur introuvable"}), 404
    if lender['capital_available'] < amount:
        return jsonify({"error": "Capital insuffisant"}), 400

    match_doc = {
        "match_id":    f"m_{lender_id}_{borrower_id}_{int(datetime.now().timestamp())}",
        "lender_id":   lender_id,
        "borrower_id": borrower_id,
        "amount":      amount,
        "status":      "FUNDED",
        "timestamp":   datetime.now()
    }
    db_manager.save_match(match_doc)
    db_manager.update_lender_capital(lender_id, amount)

    return jsonify({
        "status":      "funded",
        "lender_id":   lender_id,
        "borrower_id": borrower_id,
        "amount":      amount
    })


@lender_bp.route('/lender/<lender_id>/portfolio', methods=['GET'])
def lender_portfolio(lender_id):
    matches = db_manager.get_lender_matches(lender_id)
    lender  = db_manager.get_lender(lender_id)
    return jsonify({
        "lender_id":         lender_id,
        "capital_available": lender.get('capital_available', 0) if lender else 0,
        "funded_loans":      matches,
        "nb_loans":          len(matches)
    })


# ════════════════════════════════════════════════════════════════
# ROUTE 6 : Financements reçus par un emprunteur
# ════════════════════════════════════════════════════════════════
@lender_bp.route('/borrower/<borrower_id>/funded', methods=['GET'])
def borrower_funded(borrower_id):
    funded = db_manager.get_borrower_matches(borrower_id)
    funded_confirmed = [f for f in funded if f.get('status') == 'FUNDED']
    return jsonify({
        "borrower_id":  borrower_id,
        "funded_loans": funded_confirmed,
        "nb_funded":    len(funded_confirmed)
    })