// frontend/src/components/chat/FlightChat.jsx
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import ChatMessage from './ChatMessage';
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

  // Carica messaggi esistenti
  useEffect(() => {
    if (!flight?.id) return;
    apiClient.get(`/chat/${flight.id}`).then(res => {
      setMessages(res.data);
      setLoading(false);
    });
  }, [flight?.id]);

  // Join room socket + listener messaggi
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

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('chat:send', {
      flightId: flight.id,
      content: input.trim(),
      messageType: 'text',
    });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-flight-info">
          <strong>{flight.flight_number}</strong>
          <span>{flight.flight_type} · {flight.origin_destination}</span>
        </div>
        <div className="chat-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-body">
        {activeTab === 'Chat' && (
          <>
            <div className="messages-container">
              {loading ? (
                <div className="loading-msgs">Caricamento...</div>
              ) : (
                messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} currentUserId={user.id} />
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-bar">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Messaggio..."
                className="chat-input"
              />
              <button onClick={sendMessage} className="send-btn">→</button>
            </div>
          </>
        )}

        {activeTab === 'Timeline' && (
          <TimelineTab flight={flight} socket={socket} />
        )}
      </div>
    </div>
  );
}