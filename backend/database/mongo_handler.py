from pymongo import MongoClient

class MongoManager:
    def __init__(self, uri="mongodb://localhost:27017/", db_name="AltScoreDB"):
        # Initialisation de la connexion NoSQL [cite: 21, 28]
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.collection = self.db['transactions']

    def save_transaction(self, data):
        """Enregistre un nouveau signal client [cite: 85]"""
        return self.collection.insert_one(data)

    def get_history(self, client_id=None):
        """Récupère l'historique pour les calculs de VaR ou PCA [cite: 137]"""
        query = {"client_id": client_id} if client_id else {}
        return list(self.collection.find(query, {'_id': 0}))