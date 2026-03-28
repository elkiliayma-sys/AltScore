import numpy as np

class BayesianScorer:
    def __init__(self, prior_pd=0.1):
        # Initialisation avec le Prior (ex: 10% -> -2.2) [cite: 124]
        self.log_odds = np.log(prior_pd / (1 - prior_pd))

    def update_score(self, likelihood_ratio):
        """Mise à jour récursive: L_t = L_t-1 + ln(ratio) [cite: 117, 118]"""
        self.log_odds += np.log(likelihood_ratio)
        return self.get_pd()

    def get_pd(self):
        """Conversion Log-Odds en Probabilité de Défaut (Sigmoïde) [cite: 127, 129]"""
        return 1 / (1 + np.exp(-self.log_odds))