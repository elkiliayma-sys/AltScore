<div align="center">

<img src="https://capsule-render.vercel.app/api?type=shark&color=0:0f0c29,30:302b63,60:8e2de2,100:4a00e0&height=300&section=header&text=AltScore&fontSize=90&fontColor=00d4ff&animation=fadeIn&fontAlignY=40&desc=Alternative%20Credit%20Scoring%20Platform&descAlignY=62&descColor=bd93f9&stroke=00d4ff&strokeWidth=2" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=20&pause=1000&color=00D4FF&center=true&vCenter=true&width=800&lines=Bayesian+Scoring+Engine+%E2%80%94+Real-Time+Risk+Assessment;MongoDB+NoSQL+%E2%80%94+Event-Driven+Architecture;Borrower+x+Lender+%E2%80%94+Smart+Matching+Platform;Monte+Carlo+VaR+%E2%80%94+Portfolio+Risk+Protection;Built+by+%40elkiliayma-sys+%C2%B7+%401drien" alt="Typing SVG" />

<br/><br/>

[![Python](https://img.shields.io/badge/Python_3.10-FFD43B?style=for-the-badge&logo=python&logoColor=306998)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white)](https://numpy.org)
[![scikit-learn](https://img.shields.io/badge/sklearn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)

<br/>

[![elkiliayma](https://img.shields.io/badge/─%20@elkiliayma--sys%20─-0d1117?style=flat-square&logo=github&logoColor=00d4ff)](https://github.com/elkiliayma-sys)
[![1drien](https://img.shields.io/badge/─%20@Adrien__M%20─-0d1117?style=flat-square&logo=github&logoColor=bd93f9)](https://github.com/1drien)

<br/>

> **CY TECH — Big Data 2026**

</div>

---

## The Formula

<div align="center">

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   PD(t)  =  sigmoid( L(t-1)  +  ln( P(signal | H1) / P(signal | H0) ) )║
║                         |                      |                         ║
║                    Previous                Likelihood                    ║
║                    Log-Odds                  Ratio                       ║
║                                                                          ║
║   VaR_99%  =  Percentile_99( sum EADj x LGDj x 1[uj < PDj] )           ║
║                                       |                                  ║
║                               Monte Carlo                                ║
║                               10,000 scenarios                           ║
╚══════════════════════════════════════════════════════════════════════════╝
```

</div>

<table align="center">
<tr>
<td align="center" width="33%">

### Scoring Engine
`Bayesian Log-Odds`
Recursive update per signal
**— P(Default | Signals)**

</td>
<td align="center" width="33%">

### Matching Engine
`Compatibility Scoring`
Tolerance x Preferences
**— Borrower to Lender**

</td>
<td align="center" width="33%">

### Risk Engine
`Monte Carlo VaR 99%`
PCA + Marchenko-Pastur
**— Circuit Breaker**

</td>
</tr>
</table>

---

## Concept

<div align="center">

```
+------------------------------------------------------------------+
|                                                                  |
|   BORROWER               ALTSCORE                  LENDER       |
|   --------               --------                  ------       |
|                                                                  |
|   Submits      ------->  Bayesian         <-------  Defines     |
|   request                Scoring                    profile     |
|                                                                  |
|   Receives     <-------  Matching         ------->  Views       |
|   decision               Algorithm                  matches     |
|                                                                  |
|   Gets funded  <-------  VaR Monitor      ------->  Invests     |
|                           Circuit Breaker            and earns  |
|                                                                  |
+------------------------------------------------------------------+
```

> **"Like Tinder — but instead of finding love, you find your funding."**

</div>

---

## Architecture

```
AltScore/
|
+-- backend/
|   +-- app.py                      Flask API — 5 routes
|   +-- requirements.txt
|   |
|   +-- core/
|   |   +-- scoring_engine.py       Bayesian Log-Odds Scorer
|   |   +-- risk_analysis.py        Monte Carlo VaR + PCA
|   |   +-- preprocessor.py         Log-Transform + Z-Score
|   |
|   +-- database/
|   |   +-- mongo_handler.py        MongoDB — 5 collections
|   |
|   +-- routes/
|       +-- auth.py                 bcrypt Authentication
|       +-- lender.py               Lender + Matching routes
|       +-- rates.py                Dynamic Rate Calculator
|
+-- frontend-react/
|   +-- src/
|       +-- App.js                  Admin Dashboard
|       +-- BorrowerPortal.js       Borrower Interface
|       +-- LenderPortal.js         Lender Interface
|       +-- LoginPage.js            Auth — 2 portals
|       +-- RateSimulator.js        Real-Time Rate Simulator
|       +-- index.js                React Router
|
+-- generate_data.py                M2M Event Stream Simulator
```

---

## MongoDB Collections

<div align="center">

| Collection | Role | Key Fields |
|:----------:|------|------------|
| `users` | bcrypt authentication | `user_id` · `role` |
| `borrowers` | Enriched borrower profile | `status` · `taux_final` · `funded_by` |
| `transactions` | Behavioral signal history | `event_type` · `probability_of_default` |
| `lenders` | Lender profile and capital | `capital_available` · `risk_tolerance` |
| `matches` | Confirmed fundings | `lender_id` · `borrower_id` · `FUNDED` |

</div>

---

## Rate Engine

<div align="center">

```
Total Rate  =  BASE_RATE  +  Risk Premium  +  Platform Fee  +  Duration Extra
                 3%             PD x 1.2        1.5% to 3%       0% to 2%
                                                                       |
                                                         Capped at 20% (French law)
```

| Decision | Platform Fee | Rate Type |
|:--------:|:------------:|:---------:|
| ACCEPT | 1.5% | Simple (Consumer · Micro · Student) |
| REVIEW | 2.0% | Simple or Compound |
| REJECT | 3.0% | Compound (Mortgage · Auto · Pro) |

</div>

---

## Getting Started

### Prerequisites

```
Python 3.10+  |  Node.js 18+  |  MongoDB 7.0
```

### Installation

```bash
# Clone
git clone https://github.com/elkiliayma-sys/AltScore.git
cd AltScore

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend-react
npm install
```

### Launch

```bash
# Terminal 1 — MongoDB
mkdir -p ~/data/db
mongod --dbpath ~/data/db

# Terminal 2 — Flask API
cd backend
python app.py
# Running on http://127.0.0.1:5000

# Terminal 3 — React
cd frontend-react
npm start
# Running on http://localhost:3000

# Terminal 4 — M2M Simulator (optional)
python generate_data.py
```

### Portals

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Home — Choose your role |
| `http://localhost:3000/borrower` | Borrower Portal |
| `http://localhost:3000/lender` | Lender Portal |
| `http://localhost:3000/admin` | Admin Dashboard |

---

## API Routes

<div align="center">

| Method | Route | Description |
|:------:|-------|-------------|
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/client` | Create borrower profile |
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/predict` | Process behavioral signal |
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/add-signal` | Manual signal injection |
| ![GET](https://img.shields.io/badge/GET-00C853?style=flat-square) | `/portfolio-stats` | VaR + portfolio overview |
| ![POST](https://img.shields.io/badge/POST-9C27B0?style=flat-square) | `/lender/register` | Create lender profile |
| ![GET](https://img.shields.io/badge/GET-00C853?style=flat-square) | `/match/<id>` | Smart matching algorithm |
| ![POST](https://img.shields.io/badge/POST-9C27B0?style=flat-square) | `/lender/fund` | Confirm funding |
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/auth/register` | Register user |
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/auth/login` | Login |
| ![POST](https://img.shields.io/badge/POST-2196F3?style=flat-square) | `/rates/simulate` | Real-time rate simulation |

</div>

### Example Request

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "id":         "Client_Yasmine",
    "event_type": "Retard facture telco",
    "likelihood": 1.8,
    "amount":     1500,
    "loan_type":  "Consommation",
    "revenus":    1200,
    "months":     24
  }'
```

### Example Response

```json
{
  "status":   "success",
  "new_pd":   16.67,
  "decision": { "label": "REVIEW", "color": "orange" },
  "rates": {
    "taux_total":            12.5,
    "taux_preteur":          10.5,
    "taux_plateforme":        2.0,
    "mensualite":            76.56,
    "total_remboursement": 1837.50
  }
}
```

---

## Event Catalog

<div align="center">

| Signal | Likelihood | Impact |
|--------|:----------:|--------|
| Incoming wire transfer | 0.3 | Risk decreases strongly |
| Early repayment | 0.2 | Very positive signal |
| Telco bill paid on time | 0.4 | Positive signal |
| IP address change | 1.0 | Neutral |
| Unusual night connection | 1.3 | Mild alert |
| High crypto transaction | 1.5 | Negative signal |
| Telco bill late | 1.8 | Alert |
| Overdraft detected | 2.0 | Risk increases strongly |
| No income 30 days | 1.9 | Strong alert |
| Rejected direct debit | 2.2 | Very risky |

</div>

---

## Tech Stack

<div align="center">

[![Python](https://skillicons.dev/icons?i=python)](https://python.org)
[![Flask](https://skillicons.dev/icons?i=flask)](https://flask.palletsprojects.com)
[![MongoDB](https://skillicons.dev/icons?i=mongodb)](https://mongodb.com)
[![React](https://skillicons.dev/icons?i=react)](https://reactjs.org)
[![Linux](https://skillicons.dev/icons?i=linux)](https://linux.org)

| Layer | Technology |
|-------|-----------|
| **API** | Flask + Flask-CORS |
| **Scoring** | NumPy · Bayesian Log-Odds |
| **Risk** | Monte Carlo VaR · PCA · Marchenko-Pastur |
| **ML** | scikit-learn · PCA decomposition |
| **Database** | MongoDB 7.0 · PyMongo |
| **Auth** | bcrypt · Flask Sessions |
| **Frontend** | React 18 · Recharts · Axios |
| **Simulator** | Python M2M Event Stream |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2d1b69,50:1a0533,100:0d0221&height=120&section=footer&animation=fadeIn" width="100%"/>

[![elkiliayma](https://img.shields.io/badge/Built%20by%20@elkiliayma--sys-0d1117?style=for-the-badge&logo=github&logoColor=00d4ff)](https://github.com/elkiliayma-sys)
&nbsp;
[![1drien](https://img.shields.io/badge/@Adrien__M-0d1117?style=for-the-badge&logo=github&logoColor=bd93f9)](https://github.com/1drien)

**CY TECH · Big Data · 2026**

</div>
