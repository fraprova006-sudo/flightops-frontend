import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

const GROUPS = [
  {
    label: 'Passeggeri',
    items: [
      { id: 'preboarding_start', label: 'Preimbarco', phase: 'Start' },
      { id: 'preboarding_end',   label: 'Preimbarco', phase: 'End' },
      { id: 'boarding_start',    label: 'Imbarco',    phase: 'Start' },
      { id: 'boarding_end',      label: 'Imbarco',    phase: 'End' },
    ],
  },
  {
    label: 'Operazioni',
    items: [
      { id: 'fuel_start',      label: 'Carburante', phase: 'Start' },
      { id: 'fuel_end',        label: 'Carburante', phase: 'End' },
      { id: 'loading_start',   label: 'Loading',    phase: 'Start' },
      { id: 'loading_end',     label: 'Loading',    phase: 'End' },
      { id: 'cleaning_start',  label: 'Pulizie',    phase: 'Start' },
      { id: 'cleaning_end',    label: 'Pulizie',    phase: 'End' },
    ],
  },
  {
    label: 'PRM',
    items: [
      { id: 'prm_start', label: 'PRM', phase: 'Start' },
      { id: 'prm_end',   label: 'PRM', phase: 'End' },
      { id: 'prm_ok',    label: 'PRM OK', phase: '' },
    ],
  },
  {
    label: 'Speciali',
    items: [
      { id: 'deicing_start', label: 'De-icing', phase: 'Start' },
      { id: 'deicing_end',   label: 'De-icing', phase: 'End' },
      { id: 'doors_closed',  label: 'Porte Chiuse', phase: '' },
    ],
  },
];

export default function TimelineTab({ flight, socket }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiClient.get(`/chat/${flight.id}/timeline`).then(res => setEvents(res.data));
  }, [flight.id]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ eventType }) => {
      setEvents(prev => [...prev, { event_type: eventType, triggered_at: new Date().toISOString() }]);
    };
    socket.on('timeline:updated', handler);
    return () => socket.off('timeline:updated', handler);
  }, [socket]);

  const isTriggered = (id) => events.some(e => e.event_type === id);
  const getTime = (id) => {
    const ev = events.find(e => e.event_type === id);
    return ev ? new Date(ev.triggered_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;
  };

  const trigger = (id) => {
    if (!socket || isTriggered(id)) return;
    socket.emit('timeline:event', { flightId: flight.id, eventType: id });
  };

  return (
    <div style={styles.container}>
      {GROUPS.map(group => (
        <div key={group.label} style={styles.group}>
          <div style={styles.groupLabel}>{group.label}</div>
          <div style={styles.buttons}>
            {group.items.map(item => {
              const triggered = isTriggered(item.id);
              const time = getTime(item.id);
              return (
                <button
                  key={item.id}
                  style={{ ...styles.btn, ...(triggered ? styles.btnDone : styles.btnPending) }}
                  onClick={() => trigger(item.id)}
                  disabled={triggered}
                >
                  <span style={styles.btnLabel}>{item.label}{item.phase ? ` ${item.phase}` : ''}</span>
                  {time && <span style={styles.btnTime}>{time}</span>}
                  {triggered && <span style={styles.check}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 },
  group: {},
  groupLabel: { fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 },
  buttons: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  btn: { border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' },
  btnPending: { background: '#0f172a', color: '#94a3b8', border: '1px solid #334155' },
  btnDone: { background: '#1a2e1a', color: '#4ade80', border: '1px solid #166534', cursor: 'default' },
  btnLabel: {},
  btnTime: { fontSize: 11, opacity: 0.8 },
  check: { fontSize: 12 },
};
