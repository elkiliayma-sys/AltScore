import React, { useState, useEffect } from 'react';

// Calcul du taux d'intérêt selon le PD
function calculateRate(pd) {
  const base      = 0.03;   // taux sans risque
  const premium   = pd / 100 * 1.5;  // prime de risque
  const platform  = 0.01;  // commission plateforme
  return Math.min(base + premium + platform, 0.20); // plafonné à 20%
}

// Calcul du gain estimé pour le prêteur
function calculateGain(amount, pd, months = 24) {
  const rate        = calculateRate(pd);
  const lenderRate  = rate - 0.01; // plateforme garde 1%
  const gain        = amount * lenderRate * (months / 12);
  return Math.round(gain);
}

export default function LenderPortal({ userId, onLogout }) {
  const [step, setStep]         = useState('check');
  const [loading, setLoading]   = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [fundingDone, setFundingDone] = useState([]);
  const [form, setForm] = useState({
    name: '', capital_available: '',
    risk_tolerance: 0.20,
    loan_types: ['Consommation'],
    max_amount: 5000, min_amount: 500
  });

  const inp = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.9rem',
    marginBottom: '12px', boxSizing: 'border-box'
  };

  const LOAN_TYPES = ['Consommation', 'Micro-crédit', 'Automobile', 'Immobilier', 'Etudiant', 'Professionnel'];

  // Au chargement : vérifier si le prêteur existe déjà
  useEffect(() => {
    checkExistingProfile();
  }, []);

  // Polling toutes les 5s pour détecter de nouveaux emprunteurs
  useEffect(() => {
    if (step !== 'dashboard') return;
    const interval = setInterval(() => loadDashboard(userId), 5000);
    return () => clearInterval(interval);
  }, [step]);

  const checkExistingProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/lender/${userId}/portfolio`);
      if (res.ok) {
        const data = await res.json();
        if (data.capital_available !== undefined) {
          setPortfolio(data);
          setFundingDone(data.funded_loans || []);
          await loadCandidates();
          setStep('dashboard');
        } else {
          setStep('form');
        }
      } else {
        setStep('form');
      }
    } catch {
      setStep('form');
    }
    setLoading(false);
  };

  const loadDashboard = async (id) => {
    try {
      const [portRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/lender/${id}/portfolio`),
        fetch('http://localhost:5000/portfolio-stats')
      ]);
      const portData  = await portRes.json();
      const statsData = await statsRes.json();
      setPortfolio(portData);
      setFundingDone(portData.funded_loans || []);

      const borrowerIds = [...new Set((statsData.history || []).map(h => h.client_id))];
      const matchResults = await Promise.all(
        borrowerIds.map(bid =>
          fetch(`http://localhost:5000/match/${bid}`)
            .then(r => r.json())
            .then(data => ({
              ...data,
              isMatch: (data.matches || []).some(m => m.lender_id === id)
            }))
            .catch(() => null)
        )
      );
      setCandidates(matchResults.filter(m => m && m.isMatch));
    } catch {}
  };

  const loadCandidates = async () => {
    await loadDashboard(userId);
  };

  const handleRegister = async () => {
    if (!form.capital_available) {
      alert('Le capital disponible est obligatoire');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/lender/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender_id:         userId,
          name:              form.name || userId,
          capital_available: parseFloat(form.capital_available),
          risk_tolerance:    form.risk_tolerance,
          loan_types:        form.loan_types,
          max_amount:        form.max_amount,
          min_amount:        form.min_amount
        })
      });
      const data = await res.json();
      if (data.status === 'exists') {
        alert('Profil déjà existant.');
      } else {
        await loadDashboard(userId);
        setStep('dashboard');
      }
    } catch {
      alert('Erreur de connexion.');
    }
    setLoading(false);
  };

  const handleFund = async (borrowerId, amount, pd) => {
    const gain = calculateGain(amount, pd);
    const rate = Math.round(calculateRate(pd) * 100);
    const confirm = window.confirm(
      `Confirmer le financement ?\n\n` +
      `Emprunteur : ${borrowerId}\n` +
      `Montant : ${amount.toLocaleString()} €\n` +
      `Taux estimé : ${rate}%/an\n` +
      `Gain estimé (24 mois) : +${gain} €`
    );
    if (!confirm) return;

    const res = await fetch('http://localhost:5000/lender/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lender_id: userId, borrower_id: borrowerId, amount })
    });
    const data = await res.json();
    if (data.status === 'funded') {
      await loadDashboard(userId);
    } else {
      alert(data.error || 'Erreur');
    }
  };

  const toggleLoanType = (type) => {
    setForm(prev => ({
      ...prev,
      loan_types: prev.loan_types.includes(type)
        ? prev.loan_types.filter(t => t !== type)
        : [...prev.loan_types, type]
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ color: '#64748B' }}>Chargement de votre profil...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>

      {/* ── Header avec déconnexion ── */}
      <div style={{ backgroundColor: '#1E293B', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>ALTSCORE </span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.2rem' }}>FINTECH</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '16px' }}>Portail Prêteur</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>💼 {userId}</span>
          <a href="/borrower" style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none' }}>
            Espace Emprunteur →
          </a>
          <button
            onClick={onLogout}
            style={{ backgroundColor: 'transparent', border: '1px solid #475569', color: '#94A3B8', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '40px auto', padding: '0 20px' }}>

        {/* ══ FORMULAIRE ══ */}
        {step === 'form' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 8px', color: '#1E293B' }}>Créez votre profil prêteur</h2>
            <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '0.9rem' }}>
              Bonjour <strong>{userId}</strong>, définissez vos préférences pour trouver des emprunteurs compatibles.
            </p>

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>NOM AFFICHÉ</label>
            <input style={inp} placeholder="ex: Paul Durand" onChange={e => setForm({...form, name: e.target.value})} />

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>CAPITAL DISPONIBLE À PRÊTER (€)</label>
            <input type="number" style={inp} placeholder="5000" onChange={e => setForm({...form, capital_available: e.target.value})} />

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>
              TOLÉRANCE AU RISQUE — max {Math.round(form.risk_tolerance * 100)}% de probabilité de défaut acceptée
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

            {/* Aperçu du taux selon tolérance */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569' }}>
              Avec cette tolérance, vos emprunteurs auront un taux entre{' '}
              <strong style={{ color: '#10B981' }}>{Math.round(calculateRate(5) * 100)}%</strong> et{' '}
              <strong style={{ color: '#F59E0B' }}>{Math.round(calculateRate(form.risk_tolerance * 100) * 100)}%</strong>/an
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              {LOAN_TYPES.map(type => (
                <button key={type} onClick={() => toggleLoanType(type)} style={{
                  padding: '8px 16px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: form.loan_types.includes(type) ? '#10B981' : '#E2E8F0',
                  color: form.loan_types.includes(type) ? 'white' : '#64748B',
                }}>
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

        {/* ══ DASHBOARD ══ */}
        {step === 'dashboard' && portfolio && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Capital disponible', value: `${portfolio.capital_available?.toLocaleString()} €`, color: '#10B981' },
                { label: 'Prêts financés',     value: fundingDone.length,                                   color: '#3B82F6' },
                { label: 'Matchs disponibles', value: candidates.length,                                    color: '#F59E0B' },
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
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 'normal', marginLeft: '8px' }}>
                mise à jour automatique toutes les 5s
              </span>
            </h3>

            {candidates.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                Aucun emprunteur compatible pour l'instant.
                <br/>
                <span style={{ fontSize: '0.85rem' }}>Augmentez votre tolérance au risque ou élargissez vos types de prêts.</span>
              </div>
            )}

            {candidates.map((c, i) => {
              const rate = Math.round(calculateRate(c.borrower_pd) * 100);
              const gain = calculateGain(c.loan_amount, c.borrower_pd);
              return (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '1rem' }}>
                        👤 {c.borrower_id}
                      </div>
                      <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
                        {c.loan_type} — {c.loan_amount?.toLocaleString()} €
                      </div>

                      {/* Indicateurs financiers */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <div style={{ backgroundColor: '#F0FDF4', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <span style={{ color: '#94A3B8' }}>Taux </span>
                          <strong style={{ color: '#10B981' }}>{rate}%/an</strong>
                        </div>
                        <div style={{ backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <span style={{ color: '#94A3B8' }}>Gain estimé 24 mois </span>
                          <strong style={{ color: '#3B82F6' }}>+{gain} €</strong>
                        </div>
                        <div style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem',
                          backgroundColor: c.borrower_pd < 15 ? '#D1FAE5' : c.borrower_pd < 30 ? '#FEF3C7' : '#FEE2E2',
                          color: c.borrower_pd < 15 ? '#10B981' : c.borrower_pd < 30 ? '#F59E0B' : '#EF4444',
                        }}>
                          <span>Risque </span>
                          <strong>{c.borrower_pd}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Boutons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleFund(c.borrower_id, c.loan_amount, c.borrower_pd)}
                        style={{ padding: '10px 20px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        Je finance ✓
                      </button>
                      <button style={{ padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Passer ✗
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Prêts financés */}
            {fundingDone.length > 0 && (
              <>
                <h3 style={{ color: '#1E293B', margin: '32px 0 16px' }}>Vos prêts actifs</h3>
                {fundingDone.map((loan, i) => {
                  const gain = calculateGain(loan.amount, 12, 24); // estimation
                  return (
                    <div key={i} style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '20px', marginBottom: '8px', border: '1px solid #BBF7D0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#1E293B' }}>👤 {loan.borrower_id}</strong>
                          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
                            Financé le {new Date(loan.timestamp).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: '#10B981', fontSize: '1rem' }}>
                            {loan.amount?.toLocaleString()} €
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Gain estimé : +{gain} €
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}