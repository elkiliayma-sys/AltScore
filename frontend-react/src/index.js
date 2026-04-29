import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import BorrowerPortal from './BorrowerPortal';
import LenderPortal from './LenderPortal';
import LoginPage from './LoginPage';

function ProtectedPortal({ role, Portal }) {
  const [userId, setUserId] = React.useState(
    sessionStorage.getItem(`${role}_user`) || null
  );

  const handleSuccess = (id) => {
    sessionStorage.setItem(`${role}_user`, id);
    setUserId(id);
  };

  const handleLogout = async () => {
    await fetch('http://localhost:5000/auth/logout', {
      method: 'POST', credentials: 'include'
    });
    sessionStorage.removeItem(`${role}_user`);
    setUserId(null);
  };

  if (!userId) {
    return <LoginPage role={role} onSuccess={handleSuccess} />;
  }

  return <Portal userId={userId} onLogout={handleLogout} />;
}

// Page d'accueil — choix du rôle
function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 40px' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.3rem' }}>ALTSCORE </span>
        <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.3rem' }}>FINTECH</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>
          La plateforme de crédit alternatif
        </h1>
        <p style={{ color: '#64748B', marginBottom: '40px', textAlign: 'center' }}>
          Connectez emprunteurs et prêteurs grâce à l'intelligence des données
        </p>

        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="/borrower" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1E293B', borderRadius: '16px', padding: '40px 48px',
              textAlign: 'center', cursor: 'pointer', border: '1px solid #334155',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👤</div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>
                Je suis Emprunteur
              </div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>
                Déposez votre demande de prêt
              </div>
              <div style={{
                marginTop: '20px', padding: '10px 24px',
                backgroundColor: '#3B82F6', color: 'white',
                borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem'
              }}>
                Accéder →
              </div>
            </div>
          </a>

          <a href="/lender" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#1E293B', borderRadius: '16px', padding: '40px 48px',
              textAlign: 'center', cursor: 'pointer', border: '1px solid #334155',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💼</div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px' }}>
                Je suis Prêteur
              </div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>
                Trouvez des emprunteurs compatibles
              </div>
              <div style={{
                marginTop: '20px', padding: '10px 24px',
                backgroundColor: '#10B981', color: 'white',
                borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem'
              }}>
                Accéder →
              </div>
            </div>
          </a>
        </div>

        <a href="/admin" style={{ color: '#475569', fontSize: '0.8rem', marginTop: '40px', textDecoration: 'none' }}>
          Accès Dashboard Admin →
        </a>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/"         element={<HomePage />} />
      <Route path="/borrower" element={<ProtectedPortal role="borrower" Portal={BorrowerPortal} />} />
      <Route path="/lender"   element={<ProtectedPortal role="lender"   Portal={LenderPortal}   />} />
      <Route path="/admin"    element={<App />} />
      <Route path="*"         element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>
);