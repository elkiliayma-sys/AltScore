import React, { useState, useEffect } from 'react';

const DECISION_STYLES = {
  ACCEPT: { color: '#10B981', bg: '#D1FAE5', label: 'DOSSIER ACCEPTÉ' },
  REVIEW: { color: '#F59E0B', bg: '#FEF3C7', label: "EN COURS D'ANALYSE" },
  REJECT: { color: '#EF4444', bg: '#FEE2E2', label: 'DOSSIER REFUSÉ' },
};

// ─── Composant simulateur de taux ───────────────────────────────
function RateSimulator({ amount, pd }) {
  const [rates, setRates] = useState(null);
  const [months, setMonths] = useState(24);

  useEffect(() => {
    if (!amount || !pd) return;
    fetch('http://localhost:5000/rates/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pd: pd / 100, amount, months })
    })
      .then(r => r.json())
      .then(setRates)
      .catch(() => {});
  }, [amount, pd, months]);

  if (!rates) return null;

  return (
    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', marginTop: '16px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '16px', fontSize: '0.9rem' }}>
        💰 Simulation de votre prêt
      </div>

      {/* Sélecteur de durée */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[12, 24, 36, 48].map(m => (
          <button key={m} onClick={() => setMonths(m)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
            backgroundColor: months === m ? '#3B82F6' : '#E2E8F0',
            color: months === m ? 'white' : '#64748B'
          }}>
            {m} mois
          </button>
        ))}
      </div>

      {/* Répartition des taux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1E293B' }}>
            {rates.taux_total}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Taux total /an
          </div>
          <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '2px' }}>
            ce que vous payez
          </div>
        </div>

        <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#3B82F6' }}>
            {rates.taux_preteur}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Taux prêteur /an
          </div>
          <div style={{ fontSize: '0.7rem', color: '#93C5FD', marginTop: '2px' }}>
            rendement du prêteur
          </div>
        </div>

        <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10B981' }}>
            {rates.taux_plateforme}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
            Commission /an
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6EE7B7', marginTop: '2px' }}>
            service AltScore
          </div>
        </div>
      </div>

      {/* Barre de répartition visuelle */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>
          Répartition du taux total ({rates.taux_total}%)
        </div>
        <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
          <div style={{
            width: `${(rates.taux_preteur / rates.taux_total) * 100}%`,
            backgroundColor: '#3B82F6', height: '100%'
          }} title={`Prêteur ${rates.taux_preteur}%`} />
          <div style={{
            width: `${(rates.taux_plateforme / rates.taux_total) * 100}%`,
            backgroundColor: '#10B981', height: '100%'
          }} title={`Plateforme ${rates.taux_plateforme}%`} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.7rem', color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#3B82F6', display: 'inline-block' }}/>
            Prêteur {rates.taux_preteur}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10B981', display: 'inline-block' }}/>
            AltScore {rates.taux_plateforme}%
          </span>
        </div>
      </div>

      {/* Récapitulatif financier */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
          <div style={{ color: '#64748B' }}>Montant emprunté</div>
          <div style={{ fontWeight: 'bold', color: '#1E293B', textAlign: 'right' }}>{amount.toLocaleString()} €</div>

          <div style={{ color: '#64748B' }}>Coût total des intérêts</div>
          <div style={{ fontWeight: 'bold', color: '#EF4444', textAlign: 'right' }}>+{rates.cout_total} €</div>

          <div style={{ color: '#64748B' }}>Mensualité estimée</div>
          <div style={{ fontWeight: 'bold', color: '#1E293B', textAlign: 'right' }}>{rates.mensualite} €/mois</div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', color: '#64748B', gridColumn: '1' }}>
            Total à rembourser
          </div>
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontWeight: 'bold', color: '#1E293B', textAlign: 'right', fontSize: '1rem' }}>
            {(amount + rates.cout_total).toLocaleString()} €
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '8px', textAlign: 'center' }}>
        * Simulation indicative basée sur votre profil de risque actuel ({pd}% de probabilité de défaut)
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PORTAIL EMPRUNTEUR
// ════════════════════════════════════════════════════════════════
export default function BorrowerPortal({ userId, onLogout }) {
  const [step, setStep]     = useState('check');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [rates, setRates]   = useState(null);
  const [matches, setMatches] = useState([]);
  const [funded, setFunded] = useState([]);
  const [form, setForm]     = useState({
    amount: '', loan_type: 'Consommation',
    age: '', situation: 'Célibataire', enfants: 0,
    revenus: '', metier: '', deja_credit: false
  });

  const inp = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.9rem',
    marginBottom: '12px', boxSizing: 'border-box'
  };

  useEffect(() => { checkExistingDossier(); }, []);

  useEffect(() => {
    if (step !== 'result') return;
    const interval = setInterval(refreshMatches, 5000);
    return () => clearInterval(interval);
  }, [step]);

  const checkExistingDossier = async () => {
    try {
      const res = await fetch(`http://localhost:5000/match/${userId}`);
      if (res.ok) {
        const data = await res.json();
        // Récupérer les taux depuis la BDD
        const ratesRes = await fetch(`http://localhost:5000/rates/${userId}`);
        const ratesData = ratesRes.ok ? await ratesRes.json() : null;
        setResult({ initial_pd: data.borrower_pd, loan_amount: data.loan_amount, loan_type: data.loan_type });
        setRates(ratesData);
        setMatches(data.matches || []);
        await checkFunded();
        setStep('result');
      } else {
        setStep('form');
      }
    } catch { setStep('form'); }
    setLoading(false);
  };

  const checkFunded = async () => {
    try {
      const res = await fetch(`http://localhost:5000/borrower/${userId}/funded`);
      if (res.ok) { const data = await res.json(); setFunded(data.funded_loans || []); }
    } catch {}
  };

  const refreshMatches = async () => {
    try {
      const res = await fetch(`http://localhost:5000/match/${userId}`);
      if (res.ok) { const data = await res.json(); setMatches(data.matches || []); }
      await checkFunded();
    } catch {}
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.revenus) {
      alert('Montant et Revenus sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: userId, amount: parseInt(form.amount), revenus: parseInt(form.revenus) })
      });
      const data = await res.json();
      if (data.status === 'exists') { alert('Dossier déjà existant.'); setLoading(false); return; }
      setResult(data);
      setRates(data.rates || null);
      const matchRes  = await fetch(`http://localhost:5000/match/${userId}`);
      const matchData = await matchRes.json();
      setMatches(matchData.matches || []);
      setStep('result');
    } catch { alert('Erreur de connexion.'); }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ color: '#64748B' }}>Chargement de votre dossier...</div>
    </div>
  );

  const pd       = result?.initial_pd || 0;
  const decision = pd < 15 ? 'ACCEPT' : pd < 30 ? 'REVIEW' : 'REJECT';
  const ds       = DECISION_STYLES[decision];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1E293B', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>ALTSCORE </span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.2rem' }}>FINTECH</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '16px' }}>Portail Emprunteur</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>👤 {userId}</span>
          <button onClick={onLogout} style={{ backgroundColor: 'transparent', border: '1px solid #475569', color: '#94A3B8', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>

        {/* ══ FORMULAIRE ══ */}
        {step === 'form' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 8px', color: '#1E293B' }}>Déposez votre demande de prêt</h2>
            <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '0.9rem' }}>
              Bonjour <strong>{userId}</strong>, remplissez votre dossier pour obtenir une décision instantanée.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MONTANT (€)</label>
                <input type="number" style={inp} placeholder="1500" onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>TYPE DE PRÊT</label>
                <select style={inp} onChange={e => setForm({...form, loan_type: e.target.value})}>
                  <option>Consommation</option><option>Micro-crédit</option>
                  <option>Automobile</option><option>Immobilier</option>
                  <option>Etudiant</option><option>Professionnel</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>ÂGE</label>
                <input type="number" style={inp} placeholder="28" onChange={e => setForm({...form, age: parseInt(e.target.value)})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MÉTIER</label>
                <input style={inp} placeholder="Freelance" onChange={e => setForm({...form, metier: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>REVENUS (€/mois)</label>
                <input type="number" style={inp} placeholder="1200" onChange={e => setForm({...form, revenus: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>SITUATION</label>
                <select style={inp} onChange={e => setForm({...form, situation: e.target.value})}>
                  <option>Célibataire</option><option>Marié</option><option>Divorcé</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <input type="checkbox" id="deja" onChange={e => setForm({...form, deja_credit: e.target.checked})} />
              <label htmlFor="deja" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                J'ai déjà eu un crédit remboursé avec succès
              </label>
            </div>

            {/* Simulateur en temps réel si montant saisi */}
            {form.amount && parseInt(form.amount) > 0 && (
              <RateSimulator amount={parseInt(form.amount)} pd={10} />
            )}

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '16px' }}>
              {loading ? 'Analyse en cours...' : 'OBTENIR MA DÉCISION'}
            </button>
          </div>
        )}

        {/* ══ RÉSULTAT ══ */}
        {step === 'result' && result && (
          <>
            {/* Décision */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '12px', letterSpacing: '0.1em' }}>
                DOSSIER DE {userId.toUpperCase()}
              </div>
              <div style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '50px', backgroundColor: ds.bg, color: ds.color, fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '12px' }}>
                {ds.label}
              </div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>
                Score de risque : <strong style={{ color: ds.color }}>{pd}%</strong>
              </div>
            </div>

            {/* Taux et simulation */}
            {rates && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '16px' }}>
                  💰 Détail de votre financement
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1E293B' }}>{rates.taux_total}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Taux total /an</div>
                  </div>
                  <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#3B82F6' }}>{rates.taux_preteur}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Part prêteur /an</div>
                  </div>
                  <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10B981' }}>{rates.taux_plateforme}%</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Commission /an</div>
                  </div>
                </div>

                {/* Barre de répartition */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(rates.taux_preteur / rates.taux_total) * 100}%`, backgroundColor: '#3B82F6' }} />
                    <div style={{ width: `${(rates.taux_plateforme / rates.taux_total) * 100}%`, backgroundColor: '#10B981' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.7rem', color: '#94A3B8' }}>
                    <span>🔵 Prêteur {rates.taux_preteur}%</span>
                    <span>🟢 AltScore {rates.taux_plateforme}%</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px' }}>
                  <span style={{ color: '#64748B' }}>Montant emprunté</span>
                  <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{rates.montant?.toLocaleString()} €</span>
                  <span style={{ color: '#64748B' }}>Coût total des intérêts</span>
                  <span style={{ fontWeight: 'bold', color: '#EF4444', textAlign: 'right' }}>+{rates.cout_total} €</span>
                  <span style={{ color: '#64748B' }}>Mensualité (24 mois)</span>
                  <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{rates.mensualite} €/mois</span>
                  <span style={{ color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>Total à rembourser</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                    {rates.montant && rates.cout_total ? (rates.montant + rates.cout_total).toLocaleString() : '—'} €
                  </span>
                </div>
              </div>
            )}

            {/* Financement reçu */}
            {funded.length > 0 && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '2px solid #86EFAC' }}>
                <div style={{ fontWeight: 'bold', color: '#16A34A', fontSize: '1rem', marginBottom: '16px' }}>
                  🎉 Votre prêt a été financé !
                </div>
                {funded.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1E293B' }}>💼 {f.lender_id}</div>
                      <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{new Date(f.timestamp).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#16A34A', fontSize: '1.1rem' }}>{f.amount?.toLocaleString()} €</div>
                  </div>
                ))}
              </div>
            )}

            {/* Prêteurs compatibles */}
            <h3 style={{ color: '#1E293B', marginBottom: '12px' }}>
              {matches.length > 0 ? `${matches.length} prêteur(s) compatible(s)` : 'Recherche de prêteurs en cours...'}
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 'normal', marginLeft: '8px' }}>
                mise à jour toutes les 5s
              </span>
            </h3>
            {matches.map((m, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1E293B' }}>💼 {m.name}</div>
                    <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '4px' }}>
                      Tolérance : {m.risk_tolerance}% — Capital : {m.capital_available?.toLocaleString()} €
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
                      {m.reasons?.map((r, j) => <span key={j} style={{ marginRight: '10px' }}>✓ {r}</span>)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    Score {m.compatibility_score}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}