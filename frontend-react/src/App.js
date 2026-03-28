import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [allData, setAllData] = useState([]);
  const [stats, setStats] = useState({ current_var: 0, total_loans: 0, threshold: 50000 });
  const [selectedClientId, setSelectedClientId] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/portfolio-stats');
      setAllData(response.data.history || []);
      setStats({
        current_var: response.data.current_var,
        total_loans: response.data.total_loans,
        threshold: response.data.threshold
      });
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const dataByClient = allData.reduce((acc, curr) => {
    if (!acc[curr.client_id]) acc[curr.client_id] = [];
    acc[curr.client_id].push(curr);
    return acc;
  }, {});

  const clientIds = Object.keys(dataByClient).sort();
  useEffect(() => { if (clientIds.length > 0 && !selectedClientId) setSelectedClientId(clientIds[0]); }, [clientIds]);

  const selectedData = selectedClientId ? (dataByClient[selectedClientId] || []) : [];
  const lastSignal = selectedData[selectedData.length - 1];
  const pd = lastSignal ? (lastSignal.probability_of_default * 100).toFixed(2) : "0.00";
  const contributionVar = stats.current_var > 0 ? (( (lastSignal?.audit_trail?.expected_loss || 0) / stats.current_var) * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#E2E8F0', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR IDENTIQUE */}
      <div style={{ width: '280px', backgroundColor: '#334155', color: 'white', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '40px' }}>ALTSCORE <span style={{color: '#38BDF8'}}>FINTECH</span></h1>
        <div style={{ flex: 1 }}>
          {clientIds.map(id => (
            <div key={id} onClick={() => setSelectedClientId(id)} style={{ padding: '12px', cursor: 'pointer', borderRadius: '5px', backgroundColor: selectedClientId === id ? '#475569' : 'transparent', marginBottom: '5px', fontWeight: 'bold' }}>
              {id}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          <div>Total Prêts: {stats.total_loans.toLocaleString()} €</div>
          <div style={{ fontWeight: 'bold', marginTop: '5px' }}>VaR: {stats.current_var.toLocaleString()} € / {stats.threshold.toLocaleString()} €</div>
          <div style={{ height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${(stats.current_var / stats.threshold) * 100}%`, height: '100%', backgroundColor: '#38BDF8' }}></div>
          </div>
        </div>
      </div>

      {/* ZONE PRINCIPALE IDENTIQUE */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {selectedClientId && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#475569' }}>{selectedClientId}</h2>
              <div style={{ textAlign: 'right', color: '#94A3B8', fontSize: '0.9rem' }}>
                PD ACTUELLE: <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem' }}>{pd}%</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '30px', borderRadius: '20px', marginBottom: '30px', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                  <XAxis hide dataKey="timestamp" />
                  <YAxis domain={[0, 0.25]} stroke="#94A3B8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="probability_of_default" stroke="#38BDF8" fill="#F1F5F9" strokeWidth={2} dot={{ r: 4, fill: '#38BDF8' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', gap: '40px' }}>
              {/* SCORING */}
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#94A3B8', borderBottom: '1px solid #CBD5E1', paddingBottom: '5px' }}>📊 Scoring & Signaux</h4>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#475569' }}>
                  Log-Odds Actuels: <strong>{lastSignal?.audit_trail?.log_odds || "-"}</strong><br />
                  Dernier Likelihood Ratio: <strong>{lastSignal?.likelihood_ratio.toFixed(3)}</strong><br />
                  Fiabilité (Signaux): <strong>{selectedData.length}</strong>
                </div>
              </div>

              {/* EXPOSITION */}
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#94A3B8', borderBottom: '1px solid #CBD5E1', paddingBottom: '5px' }}>💰 Exposition Financière</h4>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#475569' }}>
                  Montant du Prêt (EAD): <strong>{lastSignal?.loan_amount.toLocaleString()} €</strong><br />
                  Perte Attendue (EL): <strong>{lastSignal?.audit_trail?.expected_loss} €</strong><br />
                  Contribution VaR: <strong>{contributionVar}%</strong>
                </div>
              </div>
            </div>

            {/* STATUT */}
            <div style={{ marginTop: '40px' }}>
              <h4 style={{ color: '#94A3B8', borderBottom: '1px solid #CBD5E1', paddingBottom: '5px' }}>🛡️ Statut de Décision</h4>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: (pd < 15) ? '#10B981' : '#EF4444' }}>
                  {(pd < 15) ? 'APPROUVÉ' : 'REFUSÉ'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Basé sur un seuil de tolérance de 15.00% de Probabilité de Défaut.</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;