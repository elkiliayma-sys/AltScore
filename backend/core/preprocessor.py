import numpy as np

class DataCleaner:
    def log_transform(self, x):
        """Transformation Logarithmique pour flux financiers: ln(1+x) [cite: 90, 93]"""
        return np.log1p(x)

    def z_score(self, x, mu, sigma):
        """Standardisation Robuste: (x - mu) / sigma [cite: 96, 98]"""
        if sigma < 1e-9: # Éviter division par zéro [cite: 102, 105]
            return 0
        return (x - mu) / sigma