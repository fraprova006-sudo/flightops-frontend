import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { SUPERVISOR_ROLES } from '../../utils/roles';
import FlightStrip from './FlightStrip';
import AssignModal from './AssignModal';
import FlightChat from '../chat/FlightChat';

export default function StripBoard() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [assignFlight, setAssignFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const isSupervisor = SUPERVISOR_ROLES.includes(user?.role);

  const loadFlights = async () => {
    try {
      const res = await apiClient.get(`/flights?date=${today}`);
      let allFlights = res.data;
      if (!isSupervisor) {
        allFlights = allFlights.filter(flight => {
          const assignments = flight.assignments || {};
          return Object.values(assignments).some(a => a.userId === user?.id);
        });
      }
      setFlights(allFlights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFlights(); }, []);
// Dopo loadFlights, aggiungi questo useEffect:
useEffect(() => {
  if (!socket || flights.length === 0) return;
  flights.forEach(f => {
    socket.emit('flight:join', { flightId: f.id });
  });
}, [socket, flights]);

  useEffect(() => {
    if (!socket) return;

    socket.on('flight:updated', () => loadFlights());

    socket.on('chat:message', (msg) => {
      const flightId = msg.flight_id;
      if (!flightId || msg.sender_id === user?.id) return;
      setSelectedFlight(current => {
        if (current?.id !== flightId) {
          setUnread(prev => ({ ...prev, [flightId]: (prev[flightId] || 0) + 1 }));
        }
        return current;
      });
    });

    return () => {
      socket.off('flight:updated');
      socket.off('chat:message');
    };
  }, [socket, user?.id]);

  const openFlight = (flight) => {
    setSelectedFlight(flight);
    setUnread(prev => ({ ...prev, [flight.id]: 0 }));
  };

  const canAssign = ['COS', 'Responsabile'].includes(user?.role);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>✈ FlightOps</span>
          <span style={styles.date}>{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.dot, background: connected ? '#22c55e' : '#ef4444' }} />
          <span style={styles.userName}>{user?.fullName} · {user?.role}</span>
          <button onClick={logout} style={styles.logoutBtn}>Esci</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.toolbar}>
          <h2 style={styles.toolbarTitle}>
            {isSupervisor ? `Strip Board — ${flights.length} voli oggi` : `I miei voli — ${flights.length}`}
          </h2>
          <button onClick={loadFlights} style={styles.refreshBtn}>↻ Aggiorna</button>
        </div>

        {loading ? (
          <div style={styles.empty}>Caricamento voli...</div>
        ) : flights.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✈</div>
            <div>{isSupervisor ? 'Nessun volo programmato per oggi' : 'Nessun volo assegnato'}</div>
          </div>
        ) : (
          <div style={styles.strips}>
            {flights.map(flight => (
              <FlightStrip
                key={flight.id}
                flight={flight}
                onOpen={() => openFlight(flight)}
                onAssign={canAssign ? () => setAssignFlight(flight) : null}
                unreadCount={unread[flight.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {selectedFlight && (
        <FlightChat flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
      )}

      {assignFlight && (
        <AssignModal
          flight={assignFlight}
          onClose={() => setAssignFlight(null)}
          onSaved={() => { setAssignFlight(null); loadFlights(); }}
        />
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui, sans-serif', color: '#f1f5f9' },
  header: { background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { fontSize: 20, fontWeight: 700, color: '#3b82f6' },
  date: { color: '#64748b', fontSize: 13 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  userName: { color: '#94a3b8', fontSize: 13 },
  logoutBtn: { background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '4px 12px', cursor: 'pointer', fontSize: 13 },
  body: { padding: 24 },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  toolbarTitle: { fontSize: 16, fontWeight: 600, color: '#94a3b8', margin: 0 },
  refreshBtn: { background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
  strips: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { textAlign: 'center', color: '#475569', padding: '80px 0', fontSize: 15 },
};
