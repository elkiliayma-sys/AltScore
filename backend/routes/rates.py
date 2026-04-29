# ════════════════════════════════════════════════════════════════
# Moteur de calcul des taux — AltScore Fintech
# ════════════════════════════════════════════════════════════════
from flask import Blueprint, request, jsonify
from database.mongo_handler import MongoManager

rates_bp   = Blueprint('rates', __name__)
db_manager = MongoManager()

BASE_RATE = 0.03  # Taux sans risque (OAT France 2026)

# Commission plateforme selon le risque
PLATFORM_FEE = {
    "ACCEPT": 0.015,
    "REVIEW": 0.020,
    "REJECT": 0.030,
}

# Majoration selon la durée (plus long = plus risqué pour le prêteur)
DURATION_PREMIUM = {
    12: 0.000,
    24: 0.005,
    36: 0.010,
    48: 0.015,
    60: 0.020,
}

MAX_RATE = 0.20  # Taux d'usure légal France


def get_decision_label(pd: float) -> str:
    if pd < 0.15: return "ACCEPT"
    if pd < 0.30: return "REVIEW"
    return "REJECT"


def calculate_rates(pd: float, amount: float, months: int = 24, type_taux: str = "simple") -> dict:
    """
    Calcule la répartition complète des taux.

    Paramètres :
        pd         : probabilité de défaut (0 à 1)
        amount     : montant du prêt en €
        months     : durée en mois (12, 24, 36, 48, 60)
        type_taux  : "simple" ou "compose"
    """
    decision       = get_decision_label(pd)
    platform_fee   = PLATFORM_FEE[decision]

    # Prime de risque basée sur le PD
    risk_premium   = pd * 1.2

    # Majoration selon la durée
    duration_key   = min(DURATION_PREMIUM.keys(), key=lambda k: abs(k - months))
    duration_extra = DURATION_PREMIUM[duration_key]

    # Taux total brut
    taux_total_raw = BASE_RATE + risk_premium + platform_fee + duration_extra

    # Plafonnement légal
    taux_total     = min(taux_total_raw, MAX_RATE)

    # Si plafonné → réduire proportionnellement
    if taux_total_raw > MAX_RATE:
        ratio        = MAX_RATE / taux_total_raw
        platform_fee = platform_fee * ratio
        risk_premium = risk_premium * ratio

    taux_preteur    = round(taux_total - platform_fee, 4)
    taux_plateforme = round(platform_fee, 4)
    taux_total      = round(taux_total, 4)

    duree_annees    = months / 12

    # ── Calcul selon type de taux ────────────────────────────────
    if type_taux == "simple":
        # Intérêts = Capital × Taux annuel × Durée en années
        cout_total      = round(amount * taux_total * duree_annees, 2)
        gain_preteur    = round(amount * taux_preteur * duree_annees, 2)
        gain_plateforme = round(amount * taux_plateforme * duree_annees, 2)
        total_remboursement = round(amount + cout_total, 2)
        mensualite      = round(total_remboursement / months, 2)

    else:  # composé
        # Montant final = Capital × (1 + taux_mensuel)^nb_mois
        taux_mensuel    = taux_total / 12
        total_remboursement = round(amount * ((1 + taux_mensuel) ** months), 2)
        cout_total      = round(total_remboursement - amount, 2)
        mensualite      = round(total_remboursement / months, 2)

        # Répartition gain prêteur / plateforme proportionnellement
        gain_preteur    = round(cout_total * (taux_preteur / taux_total), 2)
        gain_plateforme = round(cout_total * (taux_plateforme / taux_total), 2)

    return {
        # Taux
        "taux_total":           round(taux_total * 100, 2),
        "taux_preteur":         round(taux_preteur * 100, 2),
        "taux_plateforme":      round(taux_plateforme * 100, 2),
        "duration_extra_pct":   round(duration_extra * 100, 2),
        # Montants
        "montant":              amount,
        "cout_total":           cout_total,
        "total_remboursement":  total_remboursement,
        "mensualite":           mensualite,
        "gain_preteur":         gain_preteur,
        "gain_plateforme":      gain_plateforme,
        # Paramètres
        "duree_mois":           months,
        "type_taux":            type_taux,
        "decision":             decision,
        "pd_pct":               round(pd * 100, 2),
    }


@rates_bp.route('/rates/simulate', methods=['POST'])
def simulate_rates():
    data      = request.json
    pd        = float(data.get('pd', 0.10))
    amount    = float(data.get('amount', 1000))
    months    = int(data.get('months', 24))
    type_taux = data.get('type_taux', 'simple')
    result    = calculate_rates(pd, amount, months, type_taux)
    return jsonify(result)


@rates_bp.route('/rates/<borrower_id>', methods=['GET'])
def get_borrower_rates(borrower_id):
    months    = int(request.args.get('months', 24))
    type_taux = request.args.get('type_taux', 'simple')
    history   = db_manager.get_history(borrower_id)
    if not history:
        return jsonify({"error": "Emprunteur introuvable"}), 404
    last   = sorted(history, key=lambda x: x['timestamp'])[-1]
    result = calculate_rates(last['probability_of_default'], last.get('loan_amount', 0), months, type_taux)
    return jsonify(result)