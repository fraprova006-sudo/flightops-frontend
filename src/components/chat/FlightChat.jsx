import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import TimelineTab from './TimelineTab';

const TABS = ['Chat', 'Timeline'];

export default function FlightChat({ flight, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('Chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!flight?.id) return;
    apiClient.get(`/chat/${flight.id}`).then(res => {
      setMessages(res.data);
      setLoading(false);
    });
  }, [flight?.id]);

  useEffect(() => {
    if (!socket || !flight?.id) return;
    socket.emit('flight:join', { flightId: flight.id });
    const handler = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    socket.on('chat:message', handler);
    return () => {
      socket.off('chat:message', handler);
      socket.emit('flight:leave', { flightId: flight.id });
    };
  }, [socket, flight?.id]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:send', { flightId: flight.id, content: input.trim() });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.flightInfo}>
            <span style={styles.flightNum}>{flight.flight_number}</span>
            <span style={styles.flightMeta}>{flight.flight_type} · {flight.origin_destination}</span>
          </div>
          <div style={styles.tabs}>
            {TABS.map(tab => (
              <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {activeTab === 'Chat' && (
            <>
              <div style={styles.messages}>
                {loading ? (
                  <div style={styles.loading}>Caricamento...</div>
                ) : messages.length === 0 ? (
                  <div style={styles.loading}>Nessun messaggio</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={msg.id || i} style={{ ...styles.msg, ...(msg.is_system ? styles.msgSystem : msg.sender_id === user?.id ? styles.msgMine : styles.msgOther) }}>
                      {!msg.is_system && msg.sender_id !== user?.id && (
                        <div style={styles.msgSender}>{msg.sender_name} · {msg.sender_role}</div>
                      )}
                      <div style={styles.msgContent}>{msg.content}</div>
                      <div style={styles.msgTime}>{new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div style={styles.inputBar}>
                <input
                  style={styles.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Scrivi un messaggio..."
                />
                <button style={styles.sendBtn} onClick={sendMessage}>Invia</button>
              </div>
            </>
          )}

          {activeTab === 'Timeline' && (
            <TimelineTab flight={flight} socket={socket} />
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  panel: { background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 600, height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  header: { padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 16 },
  flightInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  flightNum: { fontSize: 18, fontWeight: 700, color: '#f1f5f9' },
  flightMeta: { fontSize: 12, color: '#64748b' },
  tabs: { display: 'flex', gap: 4 },
  tab: { background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#64748b', padding: '5px 14px', cursor: 'pointer', fontSize: 13 },
  tabActive: { background: '#3b82f6', borderColor: '#3b82f6', color: 'white' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' },
  body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 },
  loading: { textAlign: 'center', color: '#475569', marginTop: 40 },
  msg: { maxWidth: '75%', padding: '8px 12px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2 },
  msgMine: { alignSelf: 'flex-end', background: '#1e3a5f', borderBottomRightRadius: 2 },
  msgOther: { alignSelf: 'flex-start', background: '#0f172a', borderBottomLeftRadius: 2 },
  msgSystem: { alignSelf: 'center', background: '#1a2e1a', border: '1px solid #166534', borderRadius: 20, maxWidth: '90%' },
  msgSender: { fontSize: 10, color: '#64748b', fontWeight: 500 },
  msgContent: { fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 },
  msgTime: { fontSize: 10, color: '#475569', alignSelf: 'flex-end' },
  inputBar: { padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', gap: 8 },
  input: { flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  sendBtn: { background: '#3b82f6', border: 'none', borderRadius: 8, color: 'white', padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};
