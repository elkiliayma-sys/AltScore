import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// ─── Couleurs des seuils de décision ────────────────────────────
const DECISION_STYLES = {
  ACCEPT: { color: '#10B981', label: 'ACCEPT',  bg: '#D1FAE5' },
  REVIEW: { color: '#F59E0B', label: 'REVIEW',  bg: '#FEF3C7' },
  REJECT: { color: '#EF4444', label: 'REJECT',  bg: '#FEE2E2' },
};

// ─── Badge de décision coloré ────────────────────────────────────
function DecisionBadge({ decision }) {
  const style = DECISION_STYLES[decision] || DECISION_STYLES.ACCEPT;
  return (
    <span style={{
      backgroundColor: style.bg,
      color:           style.color,
      fontWeight:      'bold',
      padding:         '4px 12px',
      borderRadius:    '20px',
      fontSize:        '0.85rem',
    }}>
      {style.label}
    </span>
  );
}

// ─── Tooltip personnalisé pour le graphe ────────────────────────
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'white',
        border:          '1px solid #CBD5E1',
        borderRadius:    '8px',
        padding:         '10px',
        fontSize:        '0.8rem',
      }}>
        <div><strong>PD : {(d.probability_of_default * 100).toFixed(2)}%</strong></div>
        <div style={{ color: '#64748B', marginTop: '4px' }}>{d.event_type}</div>
        <div style={{ marginTop: '4px' }}><DecisionBadge decision={d.decision} /></div>
      </div>
    );
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
function App() {
  const [allData,          setAllData]          = useState([]);
  const [stats,            setStats]            = useState({
    current_var: 0, total_loans: 0, threshold: 50000,
    circuit_breaker: false, nb_clients: 0
  });
  const [selectedClientId, setSelectedClientId] = useState(null);

  // ── Fetch toutes les 2 secondes ─────────────────────────────
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/portfolio-stats');
      setAllData(res.data.history || []);
      setStats({
        current_var:     res.data.current_var,
        total_loans:     res.data.total_loans,
        threshold:       res.data.threshold,
        circuit_breaker: res.data.circuit_breaker,
        nb_clients:      res.data.nb_clients,
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Grouper les données par client ──────────────────────────
  const dataByClient = allData.reduce((acc, curr) => {
    if (!acc[curr.client_id]) acc[curr.client_id] = [];
    acc[curr.client_id].push(curr);
    return acc;
  }, {});

  const clientIds = Object.keys(dataByClient).sort();

  useEffect(() => {
    if (clientIds.length > 0 && !selectedClientId) {
      setSelectedClientId(clientIds[0]);
    }
  }, [clientIds]);

  const selectedData = selectedClientId ? (dataByClient[selectedClientId] || []) : [];
  const lastSignal   = selectedData[selectedData.length - 1];
  const pd           = lastSignal ? (lastSignal.probability_of_default * 100).toFixed(2) : '0.00';
  const decision     = lastSignal?.decision || 'ACCEPT';
  const varPercent   = Math.min((stats.current_var / stats.threshold) * 100, 100).toFixed(1);
  const varColor     = stats.circuit_breaker ? '#EF4444' : stats.current_var / stats.threshold > 0.7 ? '#F59E0B' : '#38BDF8';

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#E2E8F0', fontFamily: 'sans-serif' }}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <div style={{
        width: '280px', backgroundColor: '#334155',
        color: 'white', display: 'flex',
        flexDirection: 'column', padding: '20px'
      }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
          ALTSCORE <span style={{ color: '#38BDF8' }}>FINTECH</span>
        </h1>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '24px' }}>
          {stats.nb_clients} client{stats.nb_clients > 1 ? 's' : ''} actif{stats.nb_clients > 1 ? 's' : ''}
        </div>

        {/* Liste des clients */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {clientIds.map(id => {
            const lastTx     = dataByClient[id].slice(-1)[0];
            const clientPd   = lastTx ? (lastTx.probability_of_default * 100).toFixed(1) : '?';
            const clientDec  = lastTx?.decision || 'ACCEPT';
            const dotColor   = DECISION_STYLES[clientDec]?.color || '#10B981';
            return (
              <div
                key={id}
                onClick={() => setSelectedClientId(id)}
                style={{
                  padding:         '10px 12px',
                  cursor:          'pointer',
                  borderRadius:    '6px',
                  backgroundColor: selectedClientId === id ? '#475569' : 'transparent',
                  marginBottom:    '4px',
                  display:         'flex',
                  justifyContent:  'space-between',
                  alignItems:      'center',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{id}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    display: 'inline-block'
                  }}/>
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{clientPd}%</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* ── VaR portefeuille ── */}
        <div style={{ borderTop: '1px solid #475569', paddingTop: '16px', fontSize: '0.8rem' }}>

          {/* Circuit breaker */}
          {stats.circuit_breaker && (
            <div style={{
              backgroundColor: '#FEE2E2', color: '#EF4444',
              borderRadius: '6px', padding: '8px 10px',
              fontWeight: 'bold', marginBottom: '10px',
              fontSize: '0.8rem', textAlign: 'center',
            }}>
              ⚠ CIRCUIT BREAKER ACTIF — Prêts bloqués
            </div>
          )}

          <div style={{ color: '#94A3B8', marginBottom: '4px' }}>Exposition totale</div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {stats.total_loans.toLocaleString()} €
          </div>

          <div style={{ color: '#94A3B8', marginBottom: '4px' }}>
            VaR 99% — {stats.current_var.toLocaleString()} € / {stats.threshold.toLocaleString()} €
          </div>
          <div style={{
            height: '8px', backgroundColor: '#1E293B',
            borderRadius: '4px', overflow: 'hidden'
          }}>
            <div style={{
              width:           `${varPercent}%`,
              height:          '100%',
              backgroundColor: varColor,
              transition:      'width 0.5s ease',
            }}/>
          </div>
          <div style={{ color: '#64748B', marginTop: '4px', fontSize: '0.75rem' }}>
            {varPercent}% du seuil utilisé
          </div>
        </div>
      </div>

      {/* ══════════════════ ZONE PRINCIPALE ══════════════════ */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {selectedClientId ? (
          <>
            {/* ── En-tête client ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ fontSize: '2rem', margin: 0, color: '#1E293B' }}>
                  {selectedClientId}
                </h2>
                <div style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '4px' }}>
                  {selectedData.length} signal{selectedData.length > 1 ? 's' : ''} reçu{selectedData.length > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '6px' }}>
                  PROBABILITÉ DE DÉFAUT
                </div>
                <div style={{
                  fontSize:   '2.5rem',
                  fontWeight: 'bold',
                  color:      DECISION_STYLES[decision]?.color || '#10B981',
                }}>
                  {pd}%
                </div>
                <div style={{ marginTop: '6px' }}>
                  <DecisionBadge decision={decision} />
                </div>
              </div>
            </div>

            {/* ── Graphe évolution PD ── */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: '24px',
              borderRadius: '16px', marginBottom: '24px', height: '320px'
            }}>
              <div style={{ color: '#64748B', fontSize: '0.8rem', marginBottom: '12px' }}>
                Évolution de la probabilité de défaut
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={selectedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis hide dataKey="timestamp" />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    stroke="#94A3B8"
                    fontSize={11}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Lignes de seuil */}
                  <ReferenceLine y={0.15} stroke="#F59E0B" strokeDasharray="4 4"
                    label={{ value: 'REVIEW 15%', fontSize: 10, fill: '#F59E0B', position: 'right' }} />
                  <ReferenceLine y={0.30} stroke="#EF4444" strokeDasharray="4 4"
                    label={{ value: 'REJECT 30%', fontSize: 10, fill: '#EF4444', position: 'right' }} />
                  <Area
                    type="monotone"
                    dataKey="probability_of_default"
                    stroke="#38BDF8"
                    fill="#EFF6FF"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#38BDF8', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Métriques en 3 colonnes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>

              {/* Scoring */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 'bold' }}>
                  SCORING
                </div>
                <Row label="Log-Odds"       value={lastSignal?.audit_trail?.log_odds ?? '—'} />
                <Row label="Likelihood"     value={lastSignal?.likelihood_ratio?.toFixed(3) ?? '—'} />
                <Row label="Signaux reçus"  value={selectedData.length} />
              </div>

              {/* Exposition financière */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 'bold' }}>
                  EXPOSITION
                </div>
                <Row label="Montant (EAD)"  value={`${lastSignal?.loan_amount?.toLocaleString() ?? '—'} €`} />
                <Row label="LGD"            value={`${((lastSignal?.lgd ?? 1) * 100).toFixed(0)}%`} />
                <Row label="Perte attendue" value={`${lastSignal?.audit_trail?.expected_loss ?? '—'} €`} />
              </div>

              {/* Dernier signal */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 'bold' }}>
                  DERNIER SIGNAL
                </div>
                <div style={{
                  fontSize:     '0.85rem',
                  color:        '#334155',
                  fontWeight:   'bold',
                  marginBottom: '8px',
                  lineHeight:   '1.4',
                }}>
                  {lastSignal?.event_type ?? '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {lastSignal?.timestamp
                    ? new Date(lastSignal.timestamp).toLocaleTimeString('fr-FR')
                    : '—'
                  }
                </div>
              </div>
            </div>

            {/* ── Historique des signaux ── */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: '16px', fontWeight: 'bold' }}>
                HISTORIQUE DES SIGNAUX
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#94A3B8', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '8px', fontWeight: 'normal' }}>Événement</th>
                    <th style={{ paddingBottom: '8px', fontWeight: 'normal' }}>Ratio</th>
                    <th style={{ paddingBottom: '8px', fontWeight: 'normal' }}>PD</th>
                    <th style={{ paddingBottom: '8px', fontWeight: 'normal' }}>Décision</th>
                    <th style={{ paddingBottom: '8px', fontWeight: 'normal' }}>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {[...selectedData].reverse().slice(0, 8).map((tx, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px 0', color: '#334155' }}>{tx.event_type}</td>
                      <td style={{ padding: '8px 0', color: '#64748B' }}>{tx.likelihood_ratio?.toFixed(2)}</td>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', color: DECISION_STYLES[tx.decision]?.color }}>
                        {(tx.probability_of_default * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: '8px 0' }}>
                        <DecisionBadge decision={tx.decision} />
                      </td>
                      <td style={{ padding: '8px 0', color: '#94A3B8', fontSize: '0.75rem' }}>
                        {new Date(tx.timestamp).toLocaleTimeString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ color: '#94A3B8', textAlign: 'center', marginTop: '100px' }}>
            Sélectionne un client dans la sidebar
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant utilitaire pour une ligne de métrique ────────────
function Row({ label, value }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      fontSize:       '0.85rem',
      marginBottom:   '8px',
      color:          '#475569',
    }}>
      <span style={{ color: '#94A3B8' }}>{label}</span>
      <span style={{ fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

export default App;