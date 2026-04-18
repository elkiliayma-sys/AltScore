from pymongo import MongoClient

class MongoManager:

    def __init__(self, uri: str = "mongodb://localhost:27017/", db_name: str = "AltScoreDB"):
        """Connexion à MongoDB."""
        self.client     = MongoClient(uri)
        self.db         = self.client[db_name]
        self.collection = self.db['transactions']

    def save_transaction(self, data: dict) -> None:
        """Enregistre un événement client (un signal = un document)."""
        self.collection.insert_one(data)

    def get_history(self, client_id: str = None) -> list:
        """
        Récupère l'historique des transactions.
        - Si client_id est fourni : historique d'un seul client
        - Sinon : toutes les transactions (pour la VaR portefeuille)
        """
        query = {"client_id": client_id} if client_id else {}

        # On exclut le champ _id (non sérialisable en JSON)
        results = list(self.collection.find(query, {"_id": 0}))

        # Convertit les timestamps en string pour la sérialisation JSON
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()

        return results