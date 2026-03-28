import numpy as np

class RiskAnalyzer:
    def calculate_var(self, pd_list, ead=1000, lgd=1.0, scenarios=10000):
        """Simulation de Monte Carlo pour la Credit VaR 99% [cite: 157, 159]"""
        losses = []
        for _ in range(scenarios):
            # Tirage aléatoire u ~ U[0,1] pour chaque client [cite: 161]
            scen_loss = sum(ead * lgd for pd in pd_list if np.random.rand() < pd) # [cite: 162]
            losses.append(scen_loss)
        
        # Calcul du 99ème centile [cite: 164, 165]
        return np.percentile(losses, 99)