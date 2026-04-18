# AltScore — Alternative Credit Scoring Engine

A Big Data prototype for a microcredit fintech.
Calculates real-time default probability from alternative behavioral signals.

## Stack
- Python / Flask — REST API
- MongoDB — NoSQL event storage
- React — Dashboard
- Bayesian scoring engine with Monte Carlo VaR

## How to run

### 1. Start MongoDB
```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db
```

### 2. Start backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. Run data simulator
```bash
python generate_data.py
```

### 4. Start frontend
```bash
cd frontend-react
npm install
npm start
```

## Architecture
- `backend/core/scoring_engine.py` — Bayesian log-odds scorer
- `backend/core/risk_analysis.py` — Monte Carlo Credit VaR 99%
- `backend/core/preprocessor.py` — Log transform + Z-score normalization
- `backend/database/mongo_handler.py` — MongoDB handler
- `generate_data.py` — M2M event stream simulator
