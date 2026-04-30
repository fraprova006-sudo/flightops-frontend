// frontend/src/components/chat/TimelineTab.jsx
import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

const TIMELINE_BUTTONS = [
  { id: 'preboarding_start', label: 'Preimbarco', icon: '🚶', phase: 'start' },
  { id: 'preboarding_end',   label: 'Preimbarco', icon: '🚶', phase: 'end' },
  { id: 'boarding_start',    label: 'Imbarco',    icon: '✈️', phase: 'start' },
  { id: 'boarding_end',      label: 'Imbarco',    icon: '✈️', phase: 'end' },
  { id: 'fuel_start',        label: 'Carburante', icon: '⛽', phase: 'start' },
  { id: 'fuel_end',          label: 'Carburante', icon: '⛽', phase: 'end' },
  { id: 'loading_start',     label: 'Loading',    icon: '📦', phase: 'start' },
  { id: 'loading_end',       label: 'Loading',    icon: '📦', phase: 'end' },
  { id: 'cleaning_start',    label: 'Pulizie',    icon: '🧹', phase: 'start' },
  { id: 'cleaning_end',      label: 'Pulizie',    icon: '🧹', phase: 'end' },
  { id: 'prm_start',         label: 'PRM',        icon: '♿', phase: 'start' },
  { id: 'prm_end',           label: 'PRM',        icon: '♿', phase: 'end' },
  { id: 'prm_ok',            label: 'PRM OK',     icon: '✅', phase: 'ok' },
  { id: 'deicing_start',     label: 'De-icing',   icon: '❄️', phase: 'start' },
  { id: 'deicing_end',       label: 'De-icing',   icon: '❄️', phase: 'end' },
  { id: 'doors_closed',      label: 'Porte Chiuse', icon: '🚪', phase: 'final' },
];

export default function TimelineTab({ flight, socket }) {
  const [events, setEvents] = useState([]);
  const [firing, setFiring] = useState(null);

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

  const triggerEvent = async (eventId) => {
    setFiring(eventId);
    socket.emit('timeline:event', { flightId: flight.id, eventType: eventId });
    setTimeout(() => setFiring(null), 1000);
  };

  const isTriggered = (eventId) => events.some(e => e.event_type === eventId);

  const getTimestamp = (eventId) => {
    const ev = events.find(e => e.event_type === eventId);
    if (!ev) return null;
    return new Date(ev.triggered_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // Raggruppa per categoria
  const groups = [
    { label: 'Passeggeri', items: ['preboarding_start', 'preboarding_end', 'boarding_start', 'boarding_end'] },
    { label: 'Operazioni', items: ['fuel_start', 'fuel_end', 'loading_start', 'loading_end', 'cleaning_start', 'cleaning_end'] },
    { label: 'PRM', items: ['prm_start', 'prm_end', 'prm_ok'] },
    { label: 'Speciali', items: ['deicing_start', 'deicing_end', 'doors_closed'] },
  ];

  return (
    <div className="timeline-tab">
      {groups.map(group => (
        <div key={group.label} className="timeline-group">
          <div className="timeline-group-label">{group.label}</div>
          <div className="timeline-buttons">
            {group.items.map(eventId => {
              const btn = TIMELINE_BUTTONS.find(b => b.id === eventId);
              const triggered = isTriggered(eventId);
              const ts = getTimestamp(eventId);
              return (
                <button
                  key={eventId}
                  className={`timeline-btn ${triggered ? 'triggered' : ''} phase-${btn.phase}`}
                  onClick={() => !triggered && triggerEvent(eventId)}
                  disabled={triggered || firing === eventId}
                >
                  <span className="btn-icon">{btn.icon}</span>
                  <span className="btn-text">
                    {btn.label}
                    {btn.phase !== 'ok' && btn.phase !== 'final' && (
                      <em>{btn.phase === 'start' ? ' Start' : ' End'}</em>
                    )}
                  </span>
                  {ts && <span className="btn-time">{ts}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}