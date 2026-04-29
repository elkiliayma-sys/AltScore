# ════════════════════════════════════════════════════════════════
# Moteur de calcul des taux — AltScore Fintech
# ════════════════════════════════════════════════════════════════
# Logique de répartition :
#   Taux total = taux prêteur + commission plateforme
#   Plafonné à 20% (taux d'usure légal France)
# ════════════════════════════════════════════════════════════════

from flask import Blueprint, request, jsonify
from database.mongo_handler import MongoManager

rates_bp   = Blueprint('rates', __name__)
db_manager = MongoManager()

# Taux de base sans risque (OAT française 2026)
BASE_RATE = 0.03

# Commission plateforme selon le niveau de risque
PLATFORM_FEE = {
    "ACCEPT": 0.015,  # 1.5% — risque faible, on prend peu
    "REVIEW": 0.020,  # 2.0% — risque moyen
    "REJECT": 0.030,  # 3.0% — risque élevé, on prend plus car travail de scoring accru
}

# Plafond légal (taux d'usure France)
MAX_RATE = 0.20


def get_decision_label(pd: float) -> str:
    if pd < 0.15: return "ACCEPT"
    if pd < 0.30: return "REVIEW"
    return "REJECT"


def calculate_rates(pd: float, amount: float, months: int = 24) -> dict:
    """
    Calcule la répartition complète des taux pour un emprunteur donné.

    Retourne :
        - taux_total       : ce que paie l'emprunteur
        - taux_preteur     : ce que gagne le prêteur
        - taux_plateforme  : ce que gagne AltScore
        - cout_total       : montant total des intérêts payés
        - mensualite       : mensualité approximative
        - gain_preteur     : gain brut du prêteur sur la durée
        - gain_plateforme  : gain brut de la plateforme
    """
    decision        = get_decision_label(pd)
    platform_fee    = PLATFORM_FEE[decision]

    # Prime de risque = PD × facteur (plus risqué = taux plus élevé)
    risk_premium    = pd * 1.2

    # Taux total avant plafonnement
    taux_total_raw  = BASE_RATE + risk_premium + platform_fee

    # Plafonner à 20%
    taux_total      = min(taux_total_raw, MAX_RATE)

    # Si on a plafonné, on réduit proportionnellement prêteur et plateforme
    if taux_total_raw > MAX_RATE:
        ratio           = MAX_RATE / taux_total_raw
        platform_fee    = platform_fee * ratio
        risk_premium    = risk_premium * ratio

    taux_preteur    = round(taux_total - platform_fee, 4)
    taux_plateforme = round(platform_fee, 4)
    taux_total      = round(taux_total, 4)

    # Calculs financiers sur la durée
    duree_annees    = months / 12
    cout_total      = round(amount * taux_total * duree_annees, 2)
    gain_preteur    = round(amount * taux_preteur * duree_annees, 2)
    gain_plateforme = round(amount * taux_plateforme * duree_annees, 2)
    mensualite      = round((amount + cout_total) / months, 2)

    return {
        "taux_total":        round(taux_total * 100, 2),       # en %
        "taux_preteur":      round(taux_preteur * 100, 2),     # en %
        "taux_plateforme":   round(taux_plateforme * 100, 2),  # en %
        "cout_total":        cout_total,                        # en €
        "gain_preteur":      gain_preteur,                      # en €
        "gain_plateforme":   gain_plateforme,                   # en €
        "mensualite":        mensualite,                        # en €
        "montant":           amount,
        "duree_mois":        months,
        "decision":          decision,
        "pd_pct":            round(pd * 100, 2)
    }


@rates_bp.route('/rates/simulate', methods=['POST'])
def simulate_rates():
    """
    Endpoint pour simuler les taux en temps réel pendant la demande.
    Appelé par le formulaire emprunteur à chaque changement de montant.
    """
    data   = request.json
    pd     = float(data.get('pd', 0.10))
    amount = float(data.get('amount', 1000))
    months = int(data.get('months', 24))

    result = calculate_rates(pd, amount, months)
    return jsonify(result)


@rates_bp.route('/rates/<borrower_id>', methods=['GET'])
def get_borrower_rates(borrower_id):
    """
    Retourne les taux calculés pour un emprunteur existant.
    """
    months  = int(request.args.get('months', 24))
    history = db_manager.get_history(borrower_id)

    if not history:
        return jsonify({"error": "Emprunteur introuvable"}), 404

    last    = sorted(history, key=lambda x: x['timestamp'])[-1]
    pd      = last['probability_of_default']
    amount  = last.get('loan_amount', 0)
    result  = calculate_rates(pd, amount, months)

    return jsonify(result)