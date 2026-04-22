import numpy as np

class DataCleaner:
    """
    Module de Prétraitement des Signaux (Section 1 du document technique)
    Objectif : Normaliser des données hétérogènes pour le moteur Bayésien.
    """

    def log_transform(self, x):
        """
        1.1 Transformation Logarithmique pour flux financiers
        Formule : xt_tilde = ln(1 + xt)
        """
        if x < 0: return 0.0
        return float(np.log1p(x)) # Utilise ln(1+x)

    def calculate_z_score(self, x, history):
        """
        1.2 Standardisation Robuste pour données comportementales
        Formule : z = (x - mu) / sigma
        """
        if not history or len(history) < 2:
            return 0.0 

        mu = np.mean(history)
        sigma = np.std(history)

        if sigma < 1e-9: 
            return 0.0
            
        z = (x - mu) / sigma
        return round(float(z), 4)