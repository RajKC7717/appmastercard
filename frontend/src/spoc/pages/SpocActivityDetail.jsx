import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Download, MapPin, Users } from 'lucide-react';
import Badge, { EVENT_TONE } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import FeedbackCard from '../../shared/console/FeedbackCard.jsx';
import ThemeAverages from '../../shared/console/ThemeAverages.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { STATUS_LABEL, THEME_CODES, THEME_LABEL } from '../../shared/data/orgData.js';
import { FEEDBACK_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { formatDate, formatTimeRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * One activity, from the corporate side — problem statement L: "view
 * feedback themes and details for the activities conducted for their
 * company."
 *
 * The same record the NGO admin sees, minus the controls a SPOC does not
 * own. Showing the identical scores and the identical verbatim comments
 * to both sides is the point: the Foundation and the partner are looking
 * at one set of facts, which is exactly what a phone call and a WhatsApp
 * thread cannot produce.
 */
export default function SpocActivityDetail() {
  const { activityId } = useParams();
  const { notify } = useToast();
  const { status, error, reload, findEvent, feedbackForEvent } = useConsoleData();

  const event = findEvent(activityId);
  const feedback = feedbackForEvent(activityId);

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <Skeleton height={20} width={160} />
        <Skeleton height={40} width="60%" />
        <Skeleton height={180} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={CalendarDays}
          title="That activity is not one of yours"
          message="You can only open activities run for your own company. Check the link, or go back to the list."
          action={<Button to="/spoc/activities">Back to activities</Button>}
        />
      </div>
    );
  }

  const exportFeedback = () => {
    downloadCsv(
      reportFilename(`${event.eventName}-Feedback`),
      FEEDBACK_COLUMNS(THEME_CODES, THEME_LABEL),
      feedback,
    );
    notify({ message: `${feedback.length} responses exported as CSV.`, tone: 'info' });
  };

  const upcoming = ['UPCOMING', 'REGISTRATION_OPEN'].includes(event.status);

  return (
    <div className={styles.page}>
      <Link to="/spoc/activities" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" /> All activities
      </Link>

      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>{event.activityType}</p>
          <h1 className={styles.title}>{event.eventName}</h1>
          <div className={styles.row} style={{ marginTop: 'var(--space-3)' }}>
            <Badge tone={EVENT_TONE[event.status]} dot={event.status === 'ONGOING'}>
              {STATUS_LABEL[event.status]}
            </Badge>
          </div>
        </div>
        {feedback.length > 0 && (
          <div className={styles.headActions}>
            <Button variant="secondary" icon={Download} onClick={exportFeedback}>
              Export responses
            </Button>
          </div>
        )}
      </header>

      <section className={styles.counts} aria-label="This activity">
        <div className={styles.countPrimary}>
          <span className={styles.countValue}>
            {upcoming ? event.volunteersRegistered : `${event.responseRate}%`}
          </span>
          <span className={styles.countLabel}>
            {upcoming ? 'Volunteers registered' : 'Response rate'}
          </span>
          <span className={styles.countHint}>
            {upcoming
              ? `${Math.max(0, event.volunteersNeeded - event.volunteersRegistered)} more needed of ${event.volunteersNeeded}`
              : `${event.responses} of ${event.volunteersRegistered} volunteers`}
          </span>
        </div>
        <div className={styles.count}>
          <span className={styles.countValue}>{event.avgRating ?? '—'}</span>
          <span className={styles.countLabel}>Average score out of 5</span>
          <span className={styles.countHint}>Across all nine themes</span>
        </div>
        <div className={styles.count}>
          <span className={`${styles.countValue} ${event.lowCount ? styles.countWarn : ''}`}>
            {event.lowCount}
          </span>
          <span className={styles.countLabel}>Low scores</span>
          <span className={styles.countHint}>Answers of 1 or 2 from your volunteers</span>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>What this activity is</h2>
        <p className={styles.cardCaption}>{event.description}</p>
        <dl className={styles.facts} style={{ marginTop: 'var(--space-4)' }}>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <CalendarDays size={14} aria-hidden="true" /> Date
            </dt>
            <dd className={styles.factValue}>{formatDate(event.eventDate)}</dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <Clock size={14} aria-hidden="true" /> Time
            </dt>
            <dd className={styles.factValue}>{formatTimeRange(event.startTime, event.endTime)}</dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <MapPin size={14} aria-hidden="true" /> Venue
            </dt>
            <dd className={styles.factValue}>
              {event.location}, {event.area}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <Users size={14} aria-hidden="true" /> Volunteers needed
            </dt>
            <dd className={styles.factValue}>
              {event.volunteersRegistered} of {event.volunteersNeeded} places filled
            </dd>
          </div>
        </dl>
      </section>

      {feedback.length > 0 && <ThemeAverages feedback={feedback} />}

      <section aria-labelledby="responses-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="responses-heading" className={styles.cardTitle}>
              What your volunteers said
            </h2>
            <p className={styles.cardCaption}>
              Exactly as written. Seva Sahayog sees the same words you do.
            </p>
          </div>
        </div>

        {feedback.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No feedback yet"
            message={
              upcoming
                ? 'This activity has not happened yet. The feedback form opens the minute it ends.'
                : 'Nobody has submitted yet. A nudge in the group chat is the most effective thing you can do.'
            }
          />
        ) : (
          <div className={styles.stack}>
            {feedback.map((row) => (
              <FeedbackCard key={row.feedbackId} feedback={row} showEvent={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
