import numpy as np
from sklearn.decomposition import PCA

class RiskAnalyzer:
    # 1. Calcul de la matrice de corrélation entre les signaux 
    def calculate_correlation_matrix(self, X):
        if X.shape[0] < 2: 
            return np.eye(X.shape[0])
        return np.corrcoef(X)
    #C'est le filtre Marchenko-Pastur. En théorie des matrices aléatoires, il existe un seuil mathématique — lambda_plus — en dessous duquel une valeur propre ne représente que du bruit numérique aléatoire, pas un vrai signal.
    def apply_pca_with_filtering(self, X):
        N, T = X.shape
        if T <= N:
            return [], []
            
        q = T / N
        pca = PCA()
        pca.fit(X.T)
        
        eigenvalues = pca.explained_variance_
        
        sigma_sq = np.mean(eigenvalues)
        lambda_plus = sigma_sq * (1 + (1/q) + 2*np.sqrt(1/q))

        significant_eigenvalues = [ev for ev in eigenvalues if ev > lambda_plus]
        return significant_eigenvalues, pca.components_
    #Une fois qu'on a filtré le bruit, on projette tous les signaux sur la première composante principale. Ça crée un seul signal synthétique qui concentre l'essentiel de l'information de risque du client
    def generate_super_signal(self, X):
        if X.shape[1] < 2: 
            return X.flatten()
        pca = PCA(n_components=1)
        super_signal = pca.fit_transform(X.T)
        return super_signal.flatten()

    def calculate_var_portfolio(self, pd_list: list, ead_list: list, lgd: float = 1.0, scenarios: int = 10000) -> float:
        if not pd_list:
            return 0.0

        pd_array  = np.array(pd_list)
        ead_array = np.array(ead_list)
        total_losses = []

        for _ in range(scenarios):
            u = np.random.uniform(0, 1, size=len(pd_array))
            defaults = u < pd_array
            scenario_loss = np.sum(ead_array[defaults] * lgd)
            total_losses.append(scenario_loss)

        return float(np.percentile(total_losses, 99))
