import React, { useState, useEffect } from 'react';

export default function LenderPortal() {
  const [step, setStep]       = useState('form');  // form | dashboard
  const [lenderId, setLenderId] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lender_id: '', name: '', capital_available: '',
    risk_tolerance: 0.20, loan_types: ['Consommation'],
    max_amount: 5000, min_amount: 500
  });

  const inp = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.9rem',
    marginBottom: '12px', boxSizing: 'border-box'
  };

  const LOAN_TYPES = ['Consommation', 'Micro-crédit', 'Automobile', 'Immobilier', 'Etudiant', 'Professionnel'];

  const toggleLoanType = (type) => {
    setForm(prev => ({
      ...prev,
      loan_types: prev.loan_types.includes(type)
        ? prev.loan_types.filter(t => t !== type)
        : [...prev.loan_types, type]
    }));
  };

  const handleRegister = async () => {
    if (!form.lender_id || !form.capital_available) {
      alert('ID et Capital disponible sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/lender/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capital_available: parseFloat(form.capital_available) })
      });
      const data = await res.json();
      if (data.status === 'exists') {
        alert('Ce prêteur existe déjà. Choisissez un autre ID.');
        setLoading(false);
        return;
      }
      setLenderId(form.lender_id);
      await loadDashboard(form.lender_id);
      setStep('dashboard');
    } catch (err) {
      alert('Erreur de connexion.');
    }
    setLoading(false);
  };

  const loadDashboard = async (id) => {
    const [portRes, lendersRes] = await Promise.all([
      fetch(`http://localhost:5000/lender/${id}/portfolio`),
      fetch('http://localhost:5000/portfolio-stats')
    ]);
    const portData    = await portRes.json();
    const statsData   = await lendersRes.json();
    setPortfolio(portData);

    // Récupérer les emprunteurs uniques et checker les matchs
    const borrowerIds = [...new Set((statsData.history || []).map(h => h.client_id))];
    const matchPromises = borrowerIds.map(bid =>
      fetch(`http://localhost:5000/match/${bid}`)
        .then(r => r.json())
        .then(data => ({
          ...data,
          matches: (data.matches || []).filter(m => m.lender_id === id)
        }))
        .catch(() => null)
    );
    const allMatches = (await Promise.all(matchPromises))
      .filter(m => m && m.nb_matches > 0);
    setCandidates(allMatches);
  };

  const handleFund = async (borrowerId, amount) => {
    const res = await fetch('http://localhost:5000/lender/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lender_id: lenderId, borrower_id: borrowerId, amount })
    });
    const data = await res.json();
    if (data.status === 'funded') {
      alert(`Financement de ${amount}€ confirmé pour ${borrowerId} !`);
      await loadDashboard(lenderId);
    } else {
      alert(data.error || 'Erreur');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1E293B', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>ALTSCORE </span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.2rem' }}>FINTECH</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '16px' }}>Portail Prêteur</span>
        </div>
        <a href="/borrower" style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none' }}>
          Vous êtes emprunteur ? →
        </a>
      </div>

      <div style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px' }}>

        {step === 'form' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 8px', color: '#1E293B' }}>Créez votre profil prêteur</h2>
            <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '0.9rem' }}>
              Définissez vos préférences et trouvez des emprunteurs qui vous correspondent.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>ID PRÊTEUR</label>
                <input style={inp} placeholder="Lender_Paul" onChange={e => setForm({...form, lender_id: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>NOM AFFICHÉ</label>
                <input style={inp} placeholder="Paul Durand" onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>CAPITAL DISPONIBLE À PRÊTER (€)</label>
            <input type="number" style={inp} placeholder="5000" onChange={e => setForm({...form, capital_available: e.target.value})} />

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>
              TOLÉRANCE AU RISQUE — max {Math.round(form.risk_tolerance * 100)}% de PD acceptée
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Prudent 5%</span>
              <input
                type="range" min="0.05" max="0.50" step="0.05"
                value={form.risk_tolerance}
                onChange={e => setForm({...form, risk_tolerance: parseFloat(e.target.value)})}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Risqué 50%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MONTANT MIN (€)</label>
                <input type="number" style={inp} defaultValue="500" onChange={e => setForm({...form, min_amount: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MONTANT MAX (€)</label>
                <input type="number" style={inp} defaultValue="5000" onChange={e => setForm({...form, max_amount: parseFloat(e.target.value)})} />
              </div>
            </div>

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', display: 'block', marginBottom: '8px' }}>
              TYPES DE PRÊTS ACCEPTÉS
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {LOAN_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleLoanType(type)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', border: 'none',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: form.loan_types.includes(type) ? '#3B82F6' : '#E2E8F0',
                    color: form.loan_types.includes(type) ? 'white' : '#64748B',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              style={{ width: '100%', padding: '16px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              {loading ? 'Création...' : 'CRÉER MON PROFIL ET VOIR LES MATCHS'}
            </button>
          </div>
        )}

        {step === 'dashboard' && portfolio && (
          <>
            {/* Stats prêteur */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Capital disponible', value: `${portfolio.capital_available?.toLocaleString()} €`, color: '#10B981' },
                { label: 'Prêts actifs', value: portfolio.nb_loans, color: '#3B82F6' },
                { label: 'Matchs trouvés', value: candidates.length, color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Emprunteurs compatibles */}
            <h3 style={{ color: '#1E293B', marginBottom: '16px' }}>
              Emprunteurs compatibles avec votre profil
            </h3>

            {candidates.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                Aucun emprunteur compatible pour l'instant.<br/>
                <span style={{ fontSize: '0.85rem' }}>Augmentez votre tolérance au risque ou élargissez vos types de prêts.</span>
              </div>
            )}

            {candidates.map((c, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1E293B' }}>{c.borrower_id}</div>
                    <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
                      Type : {c.loan_type} — Montant : {c.loan_amount?.toLocaleString()} €
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{
                        backgroundColor: c.borrower_pd < 15 ? '#D1FAE5' : c.borrower_pd < 30 ? '#FEF3C7' : '#FEE2E2',
                        color: c.borrower_pd < 15 ? '#10B981' : c.borrower_pd < 30 ? '#F59E0B' : '#EF4444',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                      }}>
                        PD : {c.borrower_pd}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleFund(c.borrower_id, c.loan_amount)}
                      style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Je finance ✓
                    </button>
                    <button
                      style={{ padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Passer ✗
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Prêts actifs */}
            {portfolio.funded_loans?.length > 0 && (
              <>
                <h3 style={{ color: '#1E293B', margin: '32px 0 16px' }}>Vos prêts actifs</h3>
                {portfolio.funded_loans.map((loan, i) => (
                  <div key={i} style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '20px', marginBottom: '8px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{loan.borrower_id}</strong>
                        <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{new Date(loan.timestamp).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#10B981' }}>{loan.amount?.toLocaleString()} €</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}