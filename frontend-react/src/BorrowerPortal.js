import React, { useState } from 'react';

const DECISION_STYLES = {
  ACCEPT: { color: '#10B981', bg: '#D1FAE5', label: 'DOSSIER ACCEPTÉ' },
  REVIEW: { color: '#F59E0B', bg: '#FEF3C7', label: 'EN COURS D\'ANALYSE' },
  REJECT: { color: '#EF4444', bg: '#FEE2E2', label: 'DOSSIER REFUSÉ' },
};

export default function BorrowerPortal() {
  const [step, setStep]         = useState('form');   // form | result | matches
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [matches, setMatches]   = useState([]);
  const [form, setForm]         = useState({
    id: '', amount: '', loan_type: 'Consommation',
    age: '', situation: 'Célibataire', enfants: 0,
    revenus: '', metier: '', deja_credit: false
  });

  const inp = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.9rem',
    marginBottom: '12px', boxSizing: 'border-box'
  };

  const handleSubmit = async () => {
    if (!form.id || !form.amount || !form.revenus) {
      alert('Remplissez au minimum : ID, Montant, Revenus');
      return;
    }
    setLoading(true);
    try {
      // 1. Créer le client
      const res = await fetch('http://localhost:5000/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseInt(form.amount), revenus: parseInt(form.revenus) })
      });
      const data = await res.json();

      if (data.status === 'exists') {
        alert(`Ce client existe déjà. Utilise un autre ID.`);
        setLoading(false);
        return;
      }

      setResult(data);

      // 2. Chercher les matchs prêteurs
      const matchRes = await fetch(`http://localhost:5000/match/${form.id}`);
      const matchData = await matchRes.json();
      setMatches(matchData.matches || []);
      setStep('result');
    } catch (err) {
      alert('Erreur de connexion au serveur.');
    }
    setLoading(false);
  };

  const decisionStyle = result ? DECISION_STYLES[result.status === 'created' ?
    (result.initial_pd < 15 ? 'ACCEPT' : result.initial_pd < 30 ? 'REVIEW' : 'REJECT') : 'REVIEW'] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1E293B', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>ALTSCORE </span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.2rem' }}>FINTECH</span>
          <span style={{ color: '#64748B', fontSize: '0.85rem', marginLeft: '16px' }}>Portail Emprunteur</span>
        </div>
        <a href="/lender" style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none' }}>
          Vous êtes prêteur ? →
        </a>
      </div>

      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>

        {step === 'form' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 8px', color: '#1E293B' }}>Déposez votre demande de prêt</h2>
            <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '0.9rem' }}>
              En 2 minutes, obtenez une décision et trouvez des prêteurs compatibles.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>ID (votre identifiant)</label>
                <input style={inp} placeholder="ex: Yasmine_B" onChange={e => setForm({...form, id: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MONTANT SOUHAITÉ (€)</label>
                <input type="number" style={inp} placeholder="1500" onChange={e => setForm({...form, amount: e.target.value})} />
              </div>
            </div>

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>TYPE DE PRÊT</label>
            <select style={inp} onChange={e => setForm({...form, loan_type: e.target.value})}>
              <option>Consommation</option>
              <option>Micro-crédit</option>
              <option>Automobile</option>
              <option>Immobilier</option>
              <option>Etudiant</option>
              <option>Professionnel</option>
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>ÂGE</label>
                <input type="number" style={inp} placeholder="28" onChange={e => setForm({...form, age: parseInt(e.target.value)})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>MÉTIER</label>
                <input style={inp} placeholder="Freelance" onChange={e => setForm({...form, metier: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>REVENUS MENSUELS (€)</label>
                <input type="number" style={inp} placeholder="1200" onChange={e => setForm({...form, revenus: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>SITUATION</label>
                <select style={inp} onChange={e => setForm({...form, situation: e.target.value})}>
                  <option>Célibataire</option>
                  <option>Marié</option>
                  <option>Divorcé</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
              <input type="checkbox" id="deja" onChange={e => setForm({...form, deja_credit: e.target.checked})} />
              <label htmlFor="deja" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                J'ai déjà eu un crédit remboursé avec succès
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '16px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              {loading ? 'Analyse en cours...' : 'OBTENIR MA DÉCISION'}
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <>
            {/* Décision */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>DÉCISION POUR {form.id.toUpperCase()}</div>
              <div style={{
                display: 'inline-block', padding: '12px 32px', borderRadius: '50px',
                backgroundColor: result.initial_pd < 15 ? '#D1FAE5' : result.initial_pd < 30 ? '#FEF3C7' : '#FEE2E2',
                color: result.initial_pd < 15 ? '#10B981' : result.initial_pd < 30 ? '#F59E0B' : '#EF4444',
                fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '16px'
              }}>
                {result.initial_pd < 15 ? '✓ DOSSIER ACCEPTÉ' : result.initial_pd < 30 ? '⏳ EN COURS D\'ANALYSE' : '✗ DOSSIER REFUSÉ'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '8px' }}>
                Score de risque initial : <strong>{result.initial_pd}%</strong> de probabilité de défaut
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                Montant demandé : {parseInt(form.amount).toLocaleString()} € — Type : {form.loan_type}
              </div>
            </div>

            {/* Prêteurs compatibles */}
            <h3 style={{ color: '#1E293B', marginBottom: '16px' }}>
              {matches.length > 0 ? `${matches.length} prêteur(s) compatible(s) trouvé(s)` : 'Aucun prêteur compatible pour l\'instant'}
            </h3>

            {matches.map((m, i) => (
              <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '1rem' }}>{m.name}</div>
                    <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Tolérance risque : {m.risk_tolerance}% — Capital dispo : {m.capital_available.toLocaleString()} €</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Score {m.compatibility_score}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {m.reasons.map((r, j) => <span key={j} style={{ marginRight: '12px' }}>✓ {r}</span>)}
                </div>
              </div>
            ))}

            <button
              onClick={() => { setStep('form'); setResult(null); setMatches([]); }}
              style={{ width: '100%', padding: '14px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}
            >
              Nouvelle demande
            </button>
          </>
        )}
      </div>
    </div>
  );
}