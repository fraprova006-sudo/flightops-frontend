import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ROLES_TO_ASSIGN = [
  { key: 'gate_agent', label: 'Gate Agent' },
  { key: 'rampa', label: 'Rampa' },
  { key: 'checkin', label: 'Check-in' },
];

export default function AssignModal({ flight, onClose, onSaved }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [selections, setSelections] = useState({ gate_agent: '', rampa: '', checkin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Carica lista utenti (usiamo un endpoint semplice)
    apiClient.get('/auth/users').then(res => setUsers(res.data)).catch(() => {});

    // Pre-popola con assegnazioni esistenti
    const a = flight.assignments || {};
    setSelections({
      gate_agent: a.gate_agent?.userId || '',
      rampa: a.rampa?.userId || '',
      checkin: a.checkin?.userId || '',
    });
  }, [flight]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const [roleKey, userId] of Object.entries(selections)) {
        if (userId) {
          await apiClient.post('/assignments', {
            flightId: flight.id,
            userId,
            roleAssigned: roleKey,
          });
        }
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Assegna Staff</div>
            <div style={styles.subtitle}>{flight.flight_number} · {flight.origin_destination}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {ROLES_TO_ASSIGN.map(({ key, label }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <select
                style={styles.select}
                value={selections[key]}
                onChange={e => setSelections(s => ({ ...s, [key]: e.target.value }))}
              >
                <option value="">– Non assegnato –</option>
                {users.filter(u => u.role === label || true).map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>
          ))}

          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Annulla</button>
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva e Notifica'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  header: { padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' },
  body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#94a3b8', fontWeight: 500 },
  select: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  error: { background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '10px', color: '#fca5a5', fontSize: 13 },
  footer: { padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', padding: '10px 20px', cursor: 'pointer', fontSize: 14 },
  saveBtn: { background: '#3b82f6', border: 'none', borderRadius: 8, color: 'white', padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};
