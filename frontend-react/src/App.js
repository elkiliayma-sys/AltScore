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
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState({
    id: '', amount: 0, loan_type: 'Consommation',
    age: '', situation: 'Célibataire', enfants: 0, 
    revenus: 0, metier: '', deja_credit: false
  });

  // Style pour les champs du formulaire
  const formInputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '0.9rem', marginBottom: '10px',
    outline: 'none', focus: { border: '1px solid #3B82F6' }
  };
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
  const [showSignalForm, setShowSignalForm] = useState(false);
  const [customSignal, setCustomSignal] = useState({ event_type: '', likelihood: 1.0 });
  const EVENT_CATALOG = [
    {type: "Paiement facture telco à temps",   likelihood: 0.4},
    {type: "Virement entrant régulier",         likelihood: 0.3},
    {type: "Remboursement anticipé",            likelihood: 0.2},
    {type: "Solde compte stable 30j",           likelihood: 0.5},
    {type: "Retard facture telco",              likelihood: 1.8},
    {type: "Découvert bancaire détecté",        likelihood: 2.0},
    {type: "Absence de revenus 30j",            likelihood: 1.9},
    {type: "Rejet de prélèvement automatique",  likelihood: 2.2},
    {type: "Augmentation soudaine de l'épargne",likelihood: 0.6},
    {type: "Connexion nocturne inhabituelle",   likelihood: 1.3},
    {type: "Changement d'adresse IP",           likelihood: 1.0},
    {type: "Mise à jour profil application",    likelihood: 1.0},
    {type: "Utilisation VPN suspecte",          likelihood: 1.2},
    {type: "Vitesse de saisie formulaire élevée",likelihood: 0.8},
    {type: "Plusieurs tentatives mdp erroné",   likelihood: 1.4},
    {type: "Transaction crypto volume élevé",   likelihood: 1.5},
    {type: "Dépôt sur plateforme Exchange",     likelihood: 1.1},
    {type: "Plus-value crypto réalisée",        likelihood: 0.7},
    {type: "Appels vers l'étranger fréquents",  likelihood: 1.1},
    {type: "Recharge crédit mobile (Top-up)",   likelihood: 0.9},
    {type: "Changement fréquent de carte SIM",  likelihood: 1.7},
    {type: "Stabilité géographique (Domicile)", likelihood: 0.8},
    {type: "Demande de nouveau prêt ailleurs",  likelihood: 1.6},
    {type: "Récupération de bonus fidélité",    likelihood: 0.9},
    {type: "Contact service client (Plainte)",  likelihood: 1.05},
    {type: "Contact service client (Info)",     likelihood: 1.0}
  ];
  const handleCreateClient = async (e) => {
  e.preventDefault();
  if (!newClient.id) return alert("L'ID Client est obligatoire !");
  
  try {
    const response = await fetch('http://localhost:5000/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    });
    const data = await response.json();
    
    if (data.status === 'created') {
      alert(`✅ Succès ! Client créé avec une PD initiale de ${data.initial_pd}%`);
      setShowForm(false);
      window.location.reload(); // Pour actualiser la liste des clients
    } else {
      alert("❌ Erreur : " + data.message);
    }
  } catch (error) {
    console.error("Erreur serveur:", error);
    alert("Impossible de contacter le serveur Flask.");
  }
  };
  const handleSendSignal = async () => {
    if (!customSignal.event_type) return alert("Précisez le type d'événement");
    try {
      const response = await fetch('http://localhost:5000/add-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId, // Il utilise le client actuellement cliqué
          event_type: customSignal.event_type,
          likelihood: customSignal.likelihood
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert("Signal injecté !");
        setShowSignalForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };
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
        <button 
         onClick={() => setShowForm(true)} 
         style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: '#3661a6',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
          transition: 'all 0.2s ease'
         }}
         onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
         onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
          >
         <span style={{ fontSize: '1.2rem' }}>+</span> NOUVEAU DOSSIER
        </button>
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
                <span style={{
                 backgroundColor: '#E2E8F0',
                 color: '#475569',
                 padding: '4px 10px',
                 borderRadius: '6px',
                 fontSize: '0.75rem',
                 fontWeight: 'bold',
                 textTransform: 'uppercase',
                 letterSpacing: '0.05em'
                }}>
                {lastSignal?.loan_type || 'Prêt Standard'}
                </span>
                <div style={{ 
                 display: 'flex', 
                 gap: '15px', 
                 marginTop: '8px', 
                 color: '#64748B', 
                 fontSize: '0.85rem',
                 alignItems: 'center' 
                 }}>
                 <span><strong>{lastSignal?.client_info?.age ?? '—'}</strong> ans</span>
                 <span>•</span>
                 <span>{lastSignal?.client_info?.metier ?? '—'}</span>
                 <span>•</span>
                 <span>{lastSignal?.client_info?.situation ?? '—'} ({lastSignal?.client_info?.enfants ?? 0} enf.)</span>
                 <span>•</span>
                 <span style={{ color: '#10B981', fontWeight: 'bold' }}>{lastSignal?.client_info?.revenus?.toLocaleString() ?? '—'} €/mois</span>
                 <span>•</span>
                 <span style={{ 
                  color: lastSignal?.client_info?.deja_credit ? '#F59E0B' : '#64748B',
                  fontWeight: '500'
                  }}>
                  {lastSignal?.client_info?.deja_credit ? 'Déjà Client' : 'Nouveau Client'}
                 </span>
               </div>
                <div style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '4px' }}>
                  {selectedData.length} signal{selectedData.length > 1 ? 's' : ''} reçu{selectedData.length > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '6px' }}>
                  PROBABILITÉ DE DÉFAUT
                </div>
                <button 
                  onClick={() => setShowSignalForm(true)}
                    style={{
                    padding: '10px 20px',
                    backgroundColor: '#F59E0B', // Orange pour "Alerte/Signal"
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                    Injecter un Signal
                </button>
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
      {showForm && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', 
    justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
  }}>
    <div style={{ 
      backgroundColor: 'white', padding: '35px', borderRadius: '20px', 
      width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📝</span> Nouveau Dossier de Prêt
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B'}}>ID CLIENT</label>
          <input placeholder="Client_X" style={formInputStyle} onChange={e => setNewClient({...newClient, id: e.target.value})} />
        </div>
        <div>
          <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B'}}>MONTANT (€)</label>
          <input type="number" placeholder="5000" style={formInputStyle} onChange={e => setNewClient({...newClient, amount: parseInt(e.target.value)})} />
        </div>
      </div>

      <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B'}}>TYPE DE PRÊT</label>
      <select style={formInputStyle} onChange={e => setNewClient({...newClient, loan_type: e.target.value})}>
        <option value="Consommation">Consommation</option>
        <option value="Immobilier">Immobilier</option>
        <option value="Automobile">Automobile</option>
        <option value="Micro-crédit">Micro-crédit</option>
        <option value="Etudiant">Etudiant</option>
        <option value="Professionnel">Professionnel</option>
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
        <input type="number" placeholder="Âge" style={formInputStyle} onChange={e => setNewClient({...newClient, age: parseInt(e.target.value)})} />
        <input placeholder="Métier" style={formInputStyle} onChange={e => setNewClient({...newClient, metier: e.target.value})} />
        <input type="number" placeholder="Revenus (€/mois)" style={formInputStyle} onChange={e => setNewClient({...newClient, revenus: parseInt(e.target.value)})} />
        <select style={formInputStyle} onChange={e => setNewClient({...newClient, situation: e.target.value})}>
          <option value="Célibataire">Célibataire</option>
          <option value="Marié">Marié</option>
          <option value="Divorcé">Divorcé</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
        <label style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
          <input type="checkbox" style={{marginRight: '8px'}} onChange={e => setNewClient({...newClient, deja_credit: e.target.checked})} /> 
          Déjà client de la banque
        </label>
        <input type="number" placeholder="Enfants" style={{width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #CBD5E1'}} onChange={e => setNewClient({...newClient, enfants: parseInt(e.target.value)})} />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
        <button onClick={handleCreateClient} style={{ flex: 1, padding: '14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>CRÉER LE DOSSIER</button>
        <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ANNULER</button>
      </div>
    </div>
  </div>
)}
{showSignalForm && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
  }}>
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '450px' }}>
      <h3 style={{ marginTop: 0 }}>🚀 Injecter un Signal pour {selectedClientId}</h3>
      
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
        Choisir un événement du catalogue
      </label>
      
      <select 
        style={formInputStyle} 
        onChange={e => {
          const selectedEvent = EVENT_CATALOG.find(ev => ev.type === e.target.value);
          if (selectedEvent) {
            setCustomSignal({
              event_type: selectedEvent.type,
              likelihood: selectedEvent.likelihood
            });
          }
        }}
      >
        <option value="">-- Sélectionner un événement --</option>
        {EVENT_CATALOG.map((ev, index) => (
          <option key={index} value={ev.type}>
            {ev.type} (LR: {ev.likelihood})
          </option>
        ))}
      </select>

      {/* Affichage dynamique de l'impact pour vérification */}
      {customSignal.event_type && (
        <div style={{ 
          marginTop: '15px', padding: '10px', borderRadius: '8px',
          backgroundColor: customSignal.likelihood > 1 ? '#FEE2E2' : '#D1FAE5',
          color: customSignal.likelihood > 1 ? '#B91C1C' : '#047857',
          fontSize: '0.85rem'
        }}>
          <strong>Impact détecté :</strong> {customSignal.likelihood > 1 ? 'Hausse du risque' : 'Baisse du risque'} (x{customSignal.likelihood})
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
        <button 
          onClick={handleSendSignal} 
          style={{ flex: 1, padding: '12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          CONFIRMER
        </button>
        <button 
          onClick={() => {
            setShowSignalForm(false);
            setCustomSignal({ event_type: '', likelihood: 1.0 }); // Reset
          }} 
          style={{ flex: 1, padding: '12px', backgroundColor: '#94A3B8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ANNULER
        </button>
      </div>
    </div>
  </div>
)}
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