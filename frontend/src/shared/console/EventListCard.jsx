import { Link } from 'react-router-dom';
import { Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import Badge, { EVENT_TONE } from '../ui/Badge.jsx';
import Meter from '../ui/Meter.jsx';
import { STATUS_LABEL } from '../data/orgData.js';
import { formatShortDate, formatTimeRange, relativeDay } from '../lib/date.js';
import styles from './pieces.module.css';

/**
 * One activity as a staff member sees it on a dashboard.
 *
 * The single number on this card is the response rate, because that is
 * the number that decides what the coordinator does next: chase, or move
 * on. Everything else is context for it.
 *
 * Deliberately NOT the volunteer's EventCard reskinned. That card asks
 * "what does this want from me?"; this one asks "is this activity healthy?"
 * Reusing one for the other is the tempting shortcut that collapses the
 * whole design argument.
 */
export default function EventListCard({ event, basePath, showCompany = true }) {
  const collecting = event.status === 'ONGOING';
  const upcoming = ['UPCOMING', 'REGISTRATION_OPEN'].includes(event.status);
  const rateTone = event.responseRate >= 70 ? 'default' : 'warn';

  return (
    <article className={styles.eventCard}>
      <div className={styles.eventHead}>
        <div>
          <h3 className={styles.eventTitle}>
            <Link to={`${basePath}/${event.eventId}`} className={styles.eventLink}>
              {event.eventName}
            </Link>
          </h3>
          <p className={styles.eventType}>
            {event.activityType}
            {showCompany && ` · ${event.companyName}`}
          </p>
        </div>
        <div className={styles.eventBadges}>
          <Badge tone={EVENT_TONE[event.status]} dot={collecting}>
            {STATUS_LABEL[event.status]}
          </Badge>
          {event.needsAttention && <Badge tone="urgent" />}
        </div>
      </div>

      <dl className={styles.eventMeta}>
        <div className={styles.eventMetaRow}>
          <dt className="srOnly">Date</dt>
          <CalendarDays className={styles.eventIcon} aria-hidden="true" />
          <dd>
            {formatShortDate(event.eventDate)} · {formatTimeRange(event.startTime, event.endTime)}
          </dd>
        </div>
        <div className={styles.eventMetaRow}>
          <dt className="srOnly">Venue</dt>
          <MapPin className={styles.eventIcon} aria-hidden="true" />
          <dd>
            {event.location}, {event.area}
          </dd>
        </div>
        {showCompany && (
          <div className={styles.eventMetaRow}>
            <dt className="srOnly">Corporate partner</dt>
            <Building2 className={styles.eventIcon} aria-hidden="true" />
            <dd>{event.companyName}</dd>
          </div>
        )}
        <div className={styles.eventMetaRow}>
          <dt className="srOnly">Volunteers</dt>
          <Users className={styles.eventIcon} aria-hidden="true" />
          <dd>
            {upcoming
              ? `${event.volunteersRegistered} of ${event.volunteersNeeded} places filled`
              : `${event.volunteersRegistered} volunteers`}
          </dd>
        </div>
      </dl>

      {upcoming ? (
        <div className={styles.eventProgress}>
          <Meter
            percentage={(event.volunteersRegistered / event.volunteersNeeded) * 100}
            label={`${event.volunteersRegistered} of ${event.volunteersNeeded} places filled`}
            tone={event.volunteersRegistered / event.volunteersNeeded < 0.5 ? 'warn' : 'default'}
          />
          <p className={styles.eventProgressText}>
            {relativeDay(event.eventDate)} ·{' '}
            {Math.max(0, event.volunteersNeeded - event.volunteersRegistered)} more needed
          </p>
        </div>
      ) : (
        <div className={styles.eventProgress}>
          <Meter
            percentage={event.responseRate}
            label={`${event.responseRate}% of volunteers gave feedback`}
            tone={rateTone}
          />
          <p className={styles.eventProgressText}>
            <strong>{event.responseRate}% responded</strong> — {event.responses} of{' '}
            {event.volunteersRegistered}
            {event.pending > 0 && collecting && `, ${event.pending} still to come`}
            {event.avgRating != null && ` · averaging ${event.avgRating}/5`}
          </p>
        </div>
      )}
    </article>
  );
}
