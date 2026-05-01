import { ROLE_COLORS } from '../../utils/roles';

// Animazione lampeggio
if (typeof document !== 'undefined' && !document.getElementById('strip-anim')) {
  const style = document.createElement('style');
  style.id = 'strip-anim';
  style.textContent = `
    @keyframes pulse-strip {
      0%, 100% { border-left-color: #ef4444; box-shadow: -2px 0 12px rgba(239,68,68,0.5); }
      50% { border-left-color: #ff6b6b; box-shadow: -2px 0 20px rgba(239,68,68,0.8); }
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

const STATUS = {
  scheduled: { label: 'Programmato', color: '#64748b' },
  boarding:  { label: 'Imbarco',     color: '#f59e0b' },
  departed:  { label: 'Partito',     color: '#22c55e' },
  arrived:   { label: 'Arrivato',    color: '#3b82f6' },
  cancelled: { label: 'Cancellato',  color: '#ef4444' },
  diverted:  { label: 'Dirottato',   color: '#a855f7' },
};

export default function FlightStrip({ flight, onOpen, onAssign, unreadCount = 0, lastMessage = null }) {
  const status = STATUS[flight.status] || STATUS.scheduled;
  const isDelayed = flight.delay_minutes > 0;
  const isRyanair = flight.airline_code === 'FR';
  const hasUnread = unreadCount > 0;

  const time = (t) => t ? new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '–';

  return (
    <div style={{
      ...styles.strip,
      borderLeftColor: hasUnread ? '#ef4444' : status.color,
      animation: hasUnread ? 'pulse-strip 1.5s ease-in-out infinite' : 'none',
    }} onClick={onOpen}>

      {/* Banner messaggio non letto */}
      {hasUnread && lastMessage && (
        <div style={styles.unreadBanner}>
          <span style={styles.unreadIcon}>💬</span>
          <span style={styles.unreadText}>
            <strong>{lastMessage.sender_name}</strong>: {lastMessage.content.length > 50 ? lastMessage.content.slice(0, 50) + '…' : lastMessage.content}
          </span>
          <span style={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        </div>
      )}

      <div style={styles.col1}>
        <div style={styles.flightNum}>
          {flight.flight_number}
          {isRyanair && <span style={styles.frBadge}>FR</span>}
        </div>
        <div style={{ ...styles.typeBadge, background: flight.flight_type === 'DEP' ? '#1e3a5f' : '#1a2e1a', color: flight.flight_type === 'DEP' ? '#60a5fa' : '#4ade80' }}>
          {flight.flight_type === 'DEP' ? '↑ DEP' : '↓ ARR'}
        </div>
      </div>

      <div style={styles.col2}>
        <div style={styles.destination}>{flight.origin_destination}</div>
        <div style={styles.airline}>{flight.airline_code}</div>
      </div>

      <div style={styles.col3}>
        <div style={styles.timeStd}>{time(flight.scheduled_time)}</div>
        {isDelayed && <div style={styles.delay}>+{flight.delay_minutes}′</div>}
      </div>

      <div style={styles.col4}>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Gate</span> <span style={styles.metaVal}>{flight.gate || '–'}</span></div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>Stand</span> <span style={styles.metaVal}>{flight.stand || '–'}</span></div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>PAX</span> <span style={styles.metaVal}>{flight.pax_count || '–'}</span></div>
        <div style={styles.metaItem}><span style={styles.metaLabel}>A/C</span> <span style={styles.metaVal}>{flight.aircraft_type || '–'}</span></div>
      </div>

      <div style={styles.col5}>
        {['gate_agent', 'rampa', 'checkin'].map(role => {
          const a = flight.assignments?.[role];
          return (
            <div key={role} style={styles.staffSlot}>
              <span style={styles.staffLabel}>{role.replace('_', ' ')}</span>
              <span style={{ ...styles.staffName, color: a ? (ROLE_COLORS[a.role] || '#94a3b8') : '#334155' }}>
                {a ? a.fullName.split(' ')[0] : '–'}
              </span>
            </div>
          );
        })}
      </div>

      <div style={styles.col6}>
        <div style={{ ...styles.statusBadge, color: status.color, borderColor: status.color }}>
          {status.label}
        </div>
        <div style={styles.actions}>
          <button style={{ ...styles.chatBtn, background: hasUnread ? 'rgba(239,68,68,0.2)' : '#1e3a5f', color: hasUnread ? '#ef4444' : '#60a5fa', position: 'relative' }}
            onClick={e => { e.stopPropagation(); onOpen(); }}>
            💬 Chat
            {hasUnread && <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {onAssign && (
            <button style={styles.assignBtn} onClick={e => { e.stopPropagation(); onAssign(); }}>👤 Assegna</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  strip: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderLeft: '4px solid #64748b',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'grid',
    gridTemplateColumns: '120px 160px 80px 200px 200px 1fr',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
    transition: 'background 0.15s',
    position: 'relative',
    overflow: 'visible',
  },
  unreadBanner: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    background: 'linear-gradient(90deg, #7f1d1d, #991b1b)',
    border: '1px solid #ef4444',
    borderRadius: '8px 8px 0 0',
    padding: '5px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    animation: 'fade-in 0.3s ease',
    zIndex: 1,
  },
  unreadIcon: { fontSize: 13 },
  unreadText: { flex: 1, fontSize: 12, color: '#fca5a5', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  unreadBadge: { background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  col1: { display: 'flex', flexDirection: 'column', gap: 6 },
  flightNum: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 },
  frBadge: { background: '#1e3a5f', color: '#60a5fa', fontSize: 10, padding: '1px 5px', borderRadius: 4, fontWeight: 600 },
  typeBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, width: 'fit-content' },
  col2: { display: 'flex', flexDirection: 'column', gap: 4 },
  destination: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  airline: { fontSize: 12, color: '#64748b' },
  col3: { display: 'flex', flexDirection: 'column', gap: 4 },
  timeStd: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' },
  delay: { fontSize: 12, color: '#f59e0b', fontWeight: 600 },
  col4: { display: 'flex', flexWrap: 'wrap', gap: '4px 16px' },
  metaItem: { display: 'flex', gap: 4, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: '#475569', textTransform: 'uppercase' },
  metaVal: { fontSize: 13, fontWeight: 600, color: '#cbd5e1' },
  col5: { display: 'flex', flexDirection: 'column', gap: 4 },
  staffSlot: { display: 'flex', gap: 8, alignItems: 'center' },
  staffLabel: { fontSize: 10, color: '#475569', textTransform: 'uppercase', width: 60, flexShrink: 0 },
  staffName: { fontSize: 13, fontWeight: 500 },
  col6: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  statusBadge: { fontSize: 12, fontWeight: 600, border: '1px solid', borderRadius: 6, padding: '3px 10px' },
  actions: { display: 'flex', gap: 6 },
  chatBtn: { background: '#1e3a5f', border: 'none', borderRadius: 6, color: '#60a5fa', padding: '5px 10px', cursor: 'pointer', fontSize: 12, position: 'relative' },
  assignBtn: { background: '#1a2e1a', border: 'none', borderRadius: 6, color: '#4ade80', padding: '5px 10px', cursor: 'pointer', fontSize: 12 },
  badge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
