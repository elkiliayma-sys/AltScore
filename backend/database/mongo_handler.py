from pymongo import MongoClient, ReturnDocument

class MongoManager:

    def __init__(self, uri="mongodb://localhost:27017/", db_name="AltScoreDB"):
        self.client      = MongoClient(uri)
        self.db          = self.client[db_name]
        self.collection  = self.db['transactions']
        self.lenders     = self.db['lenders']
        self.matches     = self.db['matches']
        self.users       = self.db['users']
        self.borrowers   = self.db['borrowers']   # ← nouveau : profils emprunteurs

    # ════════════════════════════════════════════════════════════
    # USERS
    # ════════════════════════════════════════════════════════════
    def save_user(self, data):
        self.users.insert_one(data)

    def get_user(self, user_id):
        return self.users.find_one({"user_id": user_id}, {"_id": 0})

    # ════════════════════════════════════════════════════════════
    # BORROWERS — profil enrichi de l'emprunteur
    # ════════════════════════════════════════════════════════════
    def save_borrower_profile(self, data):
        """Crée ou met à jour le profil emprunteur."""
        self.borrowers.update_one(
            {"borrower_id": data["borrower_id"]},
            {"$set": data},
            upsert=True
        )

    def get_borrower_profile(self, borrower_id):
        result = self.borrowers.find_one({"borrower_id": borrower_id}, {"_id": 0})
        if result and "created_at" in result and hasattr(result["created_at"], "isoformat"):
            result["created_at"] = result["created_at"].isoformat()
        if result and "funded_at" in result and hasattr(result.get("funded_at"), "isoformat"):
            result["funded_at"] = result["funded_at"].isoformat()
        return result

    def update_borrower_status(self, borrower_id, status, funded_by=None, funded_amount=None):
        """Met à jour le statut du dossier emprunteur (PENDING/FUNDED/REJECTED)."""
        update = {"status": status}
        if funded_by:
            from datetime import datetime
            update["funded_by"]     = funded_by
            update["funded_amount"] = funded_amount
            update["funded_at"]     = datetime.now()
        self.borrowers.update_one(
            {"borrower_id": borrower_id},
            {"$set": update}
        )

    def get_all_borrower_profiles(self):
        results = list(self.borrowers.find({}, {"_id": 0}))
        for doc in results:
            for field in ["created_at", "funded_at"]:
                if field in doc and hasattr(doc[field], "isoformat"):
                    doc[field] = doc[field].isoformat()
        return results

    # ════════════════════════════════════════════════════════════
    # TRANSACTIONS (historique des signaux)
    # ════════════════════════════════════════════════════════════
    def save_transaction(self, data):
        self.collection.insert_one(data)

    def get_history(self, client_id=None):
        query   = {"client_id": client_id} if client_id else {}
        results = list(self.collection.find(query, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    # ════════════════════════════════════════════════════════════
    # LENDERS
    # ════════════════════════════════════════════════════════════
    def save_lender(self, data):
        self.lenders.insert_one(data)

    def get_lender(self, lender_id):
        result = self.lenders.find_one({"lender_id": lender_id}, {"_id": 0})
        if result and "timestamp" in result and hasattr(result["timestamp"], "isoformat"):
            result["timestamp"] = result["timestamp"].isoformat()
        return result

    def get_all_lenders(self):
        results = list(self.lenders.find({}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    def update_lender_capital(self, lender_id, amount_lent):
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
    def save_match(self, data):
        self.matches.insert_one(data)

    def get_lender_matches(self, lender_id):
        results = list(self.matches.find({"lender_id": lender_id}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results

    def get_borrower_matches(self, borrower_id):
        results = list(self.matches.find({"borrower_id": borrower_id}, {"_id": 0}))
        for doc in results:
            if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                doc["timestamp"] = doc["timestamp"].isoformat()
        return results