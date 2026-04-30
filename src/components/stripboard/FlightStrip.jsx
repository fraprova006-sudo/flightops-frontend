// frontend/src/components/stripboard/FlightStrip.jsx
import { ROLE_COLORS } from '../../utils/roles';

const STATUS_CONFIG = {
  scheduled: { label: 'Programmato', color: '#6b7280', bg: '#1f2937' },
  boarding:  { label: 'Imbarco',     color: '#f59e0b', bg: '#78350f' },
  departed:  { label: 'Partito',     color: '#10b981', bg: '#064e3b' },
  arrived:   { label: 'Arrivato',    color: '#3b82f6', bg: '#1e3a5f' },
  cancelled: { label: 'Cancellato',  color: '#ef4444', bg: '#7f1d1d' },
  diverted:  { label: 'Dirottato',   color: '#a855f7', bg: '#3b0764' },
};

const TIMELINE_STEPS = [
  'preboarding_start', 'boarding_start', 'fuel_start',
  'loading_start', 'cleaning_start', 'doors_closed'
];

export default function FlightStrip({ flight, onOpen, isHighlighted }) {
  const status = STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled;
  const isRyanair = flight.airline_code === 'FR';
  const isDelayed = flight.delay_minutes > 0;

  // Calcola progress bar in base agli eventi timeline
  const completedSteps = flight.timelineProgress || 0;
  const progressPct = Math.round((completedSteps / TIMELINE_STEPS.length) * 100);

  const scheduledTime = new Date(flight.scheduled_time).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit'
  });
  const estimatedTime = flight.estimated_time
    ? new Date(flight.estimated_time).toLocaleTimeString('it-IT', {
        hour: '2-digit', minute: '2-digit'
      })
    : null;

  return (
    <div
      className={`flight-strip ${isHighlighted ? 'highlighted' : ''} ${isDelayed ? 'delayed' : ''}`}
      onClick={() => onOpen(flight)}
      style={{ borderLeftColor: status.color }}
    >
      {/* Header */}
      <div className="strip-header">
        <div className="strip-flight-id">
          <span className="flight-number">{flight.flight_number}</span>
          {isRyanair && <span className="ryanair-badge">FR</span>}
          <span className={`flight-type-badge ${flight.flight_type}`}>
            {flight.flight_type === 'DEP' ? '↑' : '↓'} {flight.flight_type}
          </span>
        </div>
        <div
          className="strip-status"
          style={{ color: status.color, background: status.bg }}
        >
          {status.label}
        </div>
      </div>

      {/* Route & Times */}
      <div className="strip-route">
        <div className="route-info">
          <span className="airline">{flight.airline_code}</span>
          <span className="destination">{flight.origin_destination}</span>
        </div>
        <div className="strip-times">
          <span className="time-std">{scheduledTime}</span>
          {isDelayed && estimatedTime && (
            <span className="time-etd delay">ETD {estimatedTime}</span>
          )}
          {isDelayed && (
            <span className="delay-badge">+{flight.delay_minutes}′</span>
          )}
        </div>
      </div>

      {/* Stand / Gate / Aircraft */}
      <div className="strip-meta">
        <div className="meta-item">
          <span className="meta-label">Stand</span>
          <span className="meta-value">{flight.stand || '–'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Gate</span>
          <span className="meta-value">{flight.gate || '–'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">A/C</span>
          <span className="meta-value">{flight.aircraft_type || '–'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">PAX</span>
          <span className="meta-value">{flight.pax_count ?? '–'}</span>
        </div>
      </div>

      {/* Staff Assegnato */}
      <div className="strip-staff">
        {['gate_agent', 'rampa', 'checkin'].map(roleKey => {
          const assignment = flight.assignments?.[roleKey];
          return (
            <div key={roleKey} className={`staff-slot ${assignment ? 'assigned' : 'unassigned'}`}>
              <span className="slot-label">{roleKey.replace('_', ' ').toUpperCase()}</span>
              {assignment ? (
                <span
                  className="slot-name"
                  style={{ color: ROLE_COLORS[assignment.role] || '#94a3b8' }}
                >
                  {assignment.fullName.split(' ')[0]}
                </span>
              ) : (
                <span className="slot-empty">–</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="strip-progress">
        <div
          className="progress-fill"
          style={{ width: `${progressPct}%`, background: status.color }}
        />
        <span className="progress-label">{progressPct}%</span>
      </div>
    </div>
  );
}