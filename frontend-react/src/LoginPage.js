import React, { useState } from 'react';

export default function LoginPage({ role, onSuccess }) {
  const [mode, setMode]       = useState('login');  // login | register
  const [userId, setUserId]   = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const isBorrower = role === 'borrower';
  const color      = isBorrower ? '#3B82F6' : '#10B981';
  const label      = isBorrower ? 'Emprunteur' : 'Prêteur';
  const otherPath  = isBorrower ? '/lender' : '/borrower';
  const otherLabel = isBorrower ? 'Prêteur' : 'Emprunteur';

  const inp = {
    width: '100%', padding: '14px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.95rem',
    marginBottom: '14px', boxSizing: 'border-box', outline: 'none'
  };

  const handleSubmit = async () => {
    if (!userId || !password) {
      setError('Remplissez tous les champs.');
      return;
    }
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',   // important pour les cookies de session
        body: JSON.stringify({ user_id: userId, password, role })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur');
      } else {
        onSuccess(userId);
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1E293B', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>ALTSCORE </span>
          <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.2rem' }}>FINTECH</span>
        </div>
        <a href={otherPath} style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none' }}>
          Espace {otherLabel} →
        </a>
      </div>

      {/* Card centrale */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', width: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>

          {/* Icône et titre */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: color, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem'
            }}>
              {isBorrower ? '👤' : '💼'}
            </div>
            <h2 style={{ margin: 0, color: '#1E293B', fontSize: '1.4rem' }}>
              Espace {label}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '6px' }}>
              {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
            </p>
          </div>

          {/* Toggle login / register */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                  backgroundColor: mode === m ? 'white' : 'transparent',
                  color: mode === m ? color : '#94A3B8',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>
              IDENTIFIANT
            </label>
            <input
              style={inp}
              placeholder={isBorrower ? "ex: Yasmine_B" : "ex: Lender_Paul"}
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />

            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B' }}>
              MOT DE PASSE
            </label>
            <input
              type="password"
              style={inp}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            {/* Message d'erreur */}
            {error && (
              <div style={{
                backgroundColor: '#FEE2E2', color: '#EF4444',
                padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.85rem', marginBottom: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                backgroundColor: color, color: 'white',
                border: 'none', borderRadius: '10px',
                fontWeight: 'bold', fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Chargement...' : mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}