from pymongo import MongoClient

class MongoManager:

    def __init__(self, uri: str = "mongodb://localhost:27017/", db_name: str = "AltScoreDB"):
        self.client      = MongoClient(uri)
        self.db          = self.client[db_name]
        self.collection  = self.db['transactions']
        self.lenders     = self.db['lenders']
        self.matches     = self.db['matches']

    # ════════════════════════════════════════════════════════════
    # TRANSACTIONS (emprunteurs)
    # ════════════════════════════════════════════════════════════
    def save_transaction(self, data: dict) -> None:
        self.collection.insert_one(data)

    def get_history(self, client_id: str = None) -> list:
        query   = {"client_id": client_id} if client_id else {}
        results = list(self.collection.find(query, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    # ════════════════════════════════════════════════════════════
    # LENDERS (prêteurs)
    # ════════════════════════════════════════════════════════════
    def save_lender(self, data: dict) -> None:
        self.lenders.insert_one(data)

    def get_lender(self, lender_id: str) -> dict:
        result = self.lenders.find_one({"lender_id": lender_id}, {"_id": 0})
        if result and "timestamp" in result and hasattr(result["timestamp"], "isoformat"):
            result["timestamp"] = result["timestamp"].isoformat()
        return result

    def get_all_lenders(self) -> list:
        results = list(self.lenders.find({}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    def update_lender_capital(self, lender_id: str, amount_lent: float) -> None:
        self.lenders.update_one(
            {"lender_id": lender_id},
            {"$inc": {
                "capital_available": -amount_lent,
                "total_lent":         amount_lent,
                "active_loans":       1
            }}
        )

    # ════════════════════════════════════════════════════════════
    # MATCHES
    # ════════════════════════════════════════════════════════════
    def save_match(self, data: dict) -> None:
        self.matches.insert_one(data)

    def get_lender_matches(self, lender_id: str) -> list:
        results = list(self.matches.find({"lender_id": lender_id}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    def get_borrower_matches(self, borrower_id: str) -> list:
        results = list(self.matches.find({"borrower_id": borrower_id}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results