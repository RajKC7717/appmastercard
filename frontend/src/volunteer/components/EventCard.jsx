import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  PenLine,
  TreePine,
  UserPlus,
  Users,
} from 'lucide-react';
import Badge from './ui/Badge.jsx';
import Button from './ui/Button.jsx';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import { formatShortDate, formatTimeRange, relativeDay } from '../lib/format.js';
import styles from './EventCard.module.css';

const TYPE_ICON = {
  Environment: TreePine,
  Education: BookOpen,
  Health: HeartPulse,
  Community: Users,
};

/**
 * One activity — active, upcoming or past, all in the same card.
 *
 * The card answers two questions and nothing else: what is this, and what
 * does it want from me? So the SPOC's name is not here (that belongs with
 * the section built for raising needs), and the action is whichever one
 * applies — give feedback if it just happened, register if it has not.
 *
 * layout="stack" — full width, description shown.
 * layout="rail"  — fixed width inside a horizontal rail, description hidden.
 */
export default function EventCard({ activity, layout = 'stack' }) {
  const { register } = useVolunteer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const {
    activityId,
    name,
    activityType,
    date,
    startTime,
    endTime,
    venue,
    area,
    corporatePartner,
    volunteersNeeded,
    volunteersRegistered,
    isRegistered,
    description,
    status,
    alreadySubmitted,
    feedbackReference,
  } = activity;

  const TypeIcon = TYPE_ICON[activityType] ?? Users;
  const isActive = status === 'ACTIVE';
  const isUpcoming = status === 'UPCOMING';
  const remaining = Math.max(0, volunteersNeeded - volunteersRegistered);
  const isFull = remaining === 0 && !isRegistered;
  const needsFeedback = isActive && !alreadySubmitted;

  const onRegister = async () => {
    setBusy(true);
    setError(null);
    const result = await register(activityId);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <article
      className={`${styles.card} ${styles[layout]} ${isActive ? styles.cardToday : ''}`}
    >
      <div className={styles.head}>
        <span className={styles.typeIcon}>
          <TypeIcon aria-hidden="true" />
        </span>

        <div className={styles.headText}>
          <h3 className={styles.title}>{name}</h3>
          <p className={styles.type}>
            {activityType} · {corporatePartner}
          </p>
        </div>

        {/* Top-right: the action for an activity that has already happened. */}
        {needsFeedback && (
          <Button
            to={`/volunteer/feedback/${activityId}`}
            variant="primary"
            icon={PenLine}
            className={styles.headAction}
          >
            Give feedback
          </Button>
        )}
        {isActive && alreadySubmitted && (
          <Link to="/volunteer/history" className={styles.headDone}>
            <CheckCircle2 className={styles.headDoneIcon} aria-hidden="true" />
            {feedbackReference}
          </Link>
        )}
      </div>

      <div className={styles.badges}>
        {needsFeedback && <Badge tone="needed" dot />}
        {alreadySubmitted && !isActive && <Badge tone="done" icon={CheckCircle2} />}
        {isUpcoming && <Badge tone="upcoming">{relativeDay(date)}</Badge>}
        {isUpcoming && isRegistered && <Badge tone="registered" icon={Check} />}
        {isUpcoming && isFull && <Badge tone="full" />}
        {status === 'PAST' && <Badge tone="past" />}
      </div>

      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt className="srOnly">Date</dt>
          <CalendarDays className={styles.metaIcon} aria-hidden="true" />
          <dd className={styles.metaValue}>{formatShortDate(date)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt className="srOnly">Time</dt>
          <Clock className={styles.metaIcon} aria-hidden="true" />
          <dd className={styles.metaValue}>{formatTimeRange(startTime, endTime)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt className="srOnly">Venue</dt>
          <MapPin className={styles.metaIcon} aria-hidden="true" />
          <dd className={styles.metaValue}>
            {venue}, {area}
          </dd>
        </div>
        <div className={styles.metaRow}>
          <dt className="srOnly">Volunteers</dt>
          <Users className={styles.metaIcon} aria-hidden="true" />
          <dd className={`${styles.metaValue} ${isUpcoming ? styles.metaCount : ''}`}>
            {isUpcoming
              ? remaining > 0
                ? `${remaining} more needed`
                : 'No slots left'
              : `${volunteersRegistered} volunteers`}
          </dd>
        </div>
      </dl>

      {layout === 'stack' && <p className={styles.description}>{description}</p>}

      {/* Bottom: the action for an activity that has not happened yet. */}
      {isUpcoming && (
        <div className={styles.actions}>
          {isRegistered ? (
            <p className={styles.registered}>
              <Check className={styles.registeredIcon} aria-hidden="true" />
              You’re registered. Your SPOC will confirm the pickup details.
            </p>
          ) : (
            <>
              <Button
                variant={isFull ? 'secondary' : 'primary'}
                size="lg"
                fullWidth
                icon={UserPlus}
                disabled={isFull || busy}
                onClick={onRegister}
              >
                {isFull ? 'Activity is full' : busy ? 'Registering…' : 'Register'}
              </Button>
              <p className={styles.actionHint} role={error ? 'alert' : undefined}>
                {error
                  ? error
                  : isFull
                    ? 'Ask your SPOC to be added to the waiting list.'
                    : `${remaining} of ${volunteersNeeded} places still open`}
              </p>
            </>
          )}
        </div>
      )}
    </article>
  );
}
