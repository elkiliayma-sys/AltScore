import numpy as np

class RiskAnalyzer:

    def calculate_var_portfolio(self, pd_list: list, ead_list: list, lgd: float = 1.0, scenarios: int = 10000) -> float:
        """
        Monte Carlo simulation for Credit VaR 99%.
        For each scenario: draw u ~ U[0,1] per client, default if u < PD,
        loss = EAD * LGD. Return the 99th percentile of total losses.
        """
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
