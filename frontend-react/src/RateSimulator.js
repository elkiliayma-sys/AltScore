import React, { useState, useEffect } from 'react';

const TAUX_TYPE_MAP = {
  "Immobilier":    "compose",
  "Automobile":    "compose",
  "Professionnel": "compose",
  "Consommation":  "simple",
  "Micro-crédit":  "simple",
  "Etudiant":      "simple",
};

export default function RateSimulator({ amount, pd, months, loanType, onMonthsChange }) {
  const [rates, setRates] = useState(null);

  const typeTaux = TAUX_TYPE_MAP[loanType] || "simple";

  useEffect(() => {
    if (!amount || !pd || amount <= 0) return;
    fetch('http://localhost:5000/rates/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pd: pd / 100, amount, months, type_taux: typeTaux })
    }).then(r => r.json()).then(setRates).catch(() => {});
  }, [amount, pd, months, typeTaux]);

  if (!rates) return null;

  return (
    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', marginTop: '16px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Simulation de votre prêt
      </div>

      {/* Sélecteur de durée */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>DURÉE DU PRÊT</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[12, 24, 36, 48, 60].map(m => (
            <button key={m} onClick={() => onMonthsChange(m)} style={{
              padding: '6px 14px', borderRadius: '8px', border: '0.5px solid',
              borderColor: months === m ? 'transparent' : 'var(--color-border-secondary)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: months === m ? '500' : '400',
              backgroundColor: months === m ? '#3B82F6' : 'var(--color-background-primary)',
              color: months === m ? 'white' : 'var(--color-text-secondary)',
            }}>
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Type de taux — affiché, pas modifiable */}
      <div style={{
        backgroundColor: typeTaux === 'simple' ? '#EFF6FF' : '#F5F3FF',
        borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
        fontSize: '0.8rem', color: typeTaux === 'simple' ? '#1E40AF' : '#5B21B6'
      }}>
        <strong>Taux {typeTaux}</strong> — {typeTaux === 'simple'
          ? 'Intérêts calculés sur le capital initial. Formule : Capital × Taux × Durée.'
          : 'Intérêts recalculés chaque mois sur le capital restant. Standard bancaire.'}
        <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.7 }}>
          Type de taux défini par la plateforme selon votre produit.
        </div>
      </div>

      {/* Les 3 taux */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>{rates.taux_total}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Taux total /an</div>
          <div style={{ fontSize: '0.65rem', color: '#F59E0B', marginTop: '2px' }}>vous payez</div>
        </div>
        <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '500', color: '#1E40AF' }}>{rates.taux_preteur}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Part prêteur /an</div>
          <div style={{ fontSize: '0.65rem', color: '#3B82F6', marginTop: '2px' }}>rendement</div>
        </div>
        <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '500', color: '#166534' }}>{rates.taux_plateforme}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Commission /an</div>
          <div style={{ fontSize: '0.65rem', color: '#16A34A', marginTop: '2px' }}>AltScore</div>
        </div>
      </div>

      {/* Barre de répartition */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(rates.taux_preteur / rates.taux_total) * 100}%`, backgroundColor: '#3B82F6' }} />
          <div style={{ width: `${(rates.taux_plateforme / rates.taux_total) * 100}%`, backgroundColor: '#16A34A' }} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '5px', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
          <span>Prêteur {rates.taux_preteur}%</span>
          <span>AltScore {rates.taux_plateforme}%</span>
        </div>
      </div>

      {/* Récap financier */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '14px', border: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Montant emprunté</span>
          <span style={{ fontWeight: '500', textAlign: 'right', color: 'var(--color-text-primary)' }}>{Number(amount).toLocaleString()} €</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Coût total des intérêts</span>
          <span style={{ fontWeight: '500', color: '#DC2626', textAlign: 'right' }}>+{rates.cout_total} €</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Mensualité ({months} mois)</span>
          <span style={{ fontWeight: '500', textAlign: 'right', color: 'var(--color-text-primary)' }}>{rates.mensualite} €/mois</span>
          <span style={{ color: 'var(--color-text-secondary)', borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: '8px' }}>Total à rembourser</span>
          <span style={{ fontWeight: '500', fontSize: '1rem', textAlign: 'right', borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: '8px', color: 'var(--color-text-primary)' }}>
            {rates.total_remboursement?.toLocaleString()} €
          </span>
        </div>
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '8px', textAlign: 'center' }}>
        Simulation basée sur un score de risque initial de {pd}%
      </div>
    </div>
  );
}