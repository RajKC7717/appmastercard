import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  Download,
  MapPin,
  Pencil,
  Sparkles,
  UserCircle2,
  Users,
} from 'lucide-react';
import Badge, { EVENT_TONE } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { SelectInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import FeedbackCard from '../../shared/console/FeedbackCard.jsx';
import ThemeAverages from '../../shared/console/ThemeAverages.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import ActivityFormDialog from '../components/ActivityFormDialog.jsx';
import AttendanceSheet from '../components/AttendanceSheet.jsx';
import { ACTION_PLAN_FOR_EVENT } from '../data/actionPlanIndex.js';
import { EVENT_STATUSES, STATUS_LABEL, THEME_CODES, THEME_LABEL } from '../../shared/data/orgData.js';
import { FEEDBACK_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { formatDate, formatTimeRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * One activity, everything about it. Register B, archetype B (detail):
 * back link, then the title with its status and its actions top-right,
 * then facts, then what the feedback says.
 *
 * The status dropdown sits with the actions because changing status is
 * the action an admin most often comes to this page to perform — an
 * activity does not collect feedback until someone moves it to Happening
 * now, and that transition is the one operational step the whole product
 * depends on.
 */
export default function AdminActivityDetail() {
  const { activityId } = useParams();
  const { notify } = useToast();
  const {
    status,
    error,
    reload,
    findEvent,
    feedbackForEvent,
    companies,
    updateEvent,
    setEventStatus,
  } = useConsoleData();

  const [editing, setEditing] = useState(false);

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
          title="That activity is not here"
          message="It may have been created on another device, or the link may be out of date."
          action={<Button to="/admin/activities">Back to activities</Button>}
        />
      </div>
    );
  }

  const changeStatus = async (next) => {
    const previous = event.status;
    const result = await setEventStatus(event.eventId, next);

    if (!result.ok) {
      notify({ message: result.error, tone: 'error' });
      return;
    }

    notify({
      message: `${event.eventName} is now ${STATUS_LABEL[next].toLowerCase()}.`,
      action: () => setEventStatus(event.eventId, previous),
    });
  };

  const saveEdits = async (payload) => {
    const result = await updateEvent(event.eventId, {
      eventName: payload.eventName.trim(),
      activityType: payload.activityType,
      eventDate: `${payload.eventDate}T${payload.startTime}:00+05:30`,
      startTime: payload.startTime,
      endTime: payload.endTime,
      feedbackStart: `${payload.eventDate}T${payload.endTime}:00+05:30`,
      feedbackEnd: `${payload.eventDate}T23:59:00+05:30`,
      location: payload.location.trim(),
      area: payload.area,
      volunteersNeeded: payload.volunteersNeeded,
      description: payload.description.trim(),
      status: payload.status,
    });

    if (result.ok) {
      setEditing(false);
      notify({ message: 'Activity updated.' });
    }
    return result;
  };

  const exportFeedback = () => {
    downloadCsv(
      reportFilename(`${event.eventName}-Feedback`),
      FEEDBACK_COLUMNS(THEME_CODES, THEME_LABEL),
      feedback,
    );
    notify({ message: `${feedback.length} responses exported as CSV.`, tone: 'info' });
  };

  const plan = ACTION_PLAN_FOR_EVENT[event.eventId];
  const collecting = event.status === 'ONGOING';

  return (
    <div className={styles.page}>
      <Link to="/admin/activities" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" /> All activities
      </Link>

      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>
            {event.activityType} · {event.companyName}
          </p>
          <h1 className={styles.title}>{event.eventName}</h1>
          <div className={styles.row} style={{ marginTop: 'var(--space-3)' }}>
            <Badge tone={EVENT_TONE[event.status]} dot={collecting}>
              {STATUS_LABEL[event.status]}
            </Badge>
            {event.needsAttention && <Badge tone="urgent" />}
          </div>
        </div>

        <div className={styles.headActions}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="event-status">
              Status
            </label>
            <SelectInput
              id="event-status"
              value={event.status}
              onChange={(changeEvent) => changeStatus(changeEvent.target.value)}
              options={EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
            />
          </div>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="secondary" icon={Download} onClick={exportFeedback}>
            Export
          </Button>
        </div>
      </header>

      <section className={styles.counts} aria-label="Feedback for this activity">
        <div className={styles.countPrimary}>
          <span className={styles.countValue}>{event.responseRate}%</span>
          <span className={styles.countLabel}>Response rate</span>
          <span className={styles.countHint}>
            {event.responses} of {event.volunteersRegistered} volunteers
            {collecting && event.pending > 0 && ` · ${event.pending} still to come`}
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
          <span className={styles.countHint}>Answers of 1 or 2, each with a written reason</span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="facts-heading">
        <h2 id="facts-heading" className={styles.cardTitle}>
          Activity record
        </h2>
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
              <Building2 size={14} aria-hidden="true" /> Corporate partner
            </dt>
            <dd className={styles.factValue}>{event.companyName}</dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <UserCircle2 size={14} aria-hidden="true" /> Corporate SPOC
            </dt>
            <dd className={styles.factValue}>{event.spocName ?? 'Not assigned'}</dd>
          </div>
          <div className={styles.fact}>
            <dt className={styles.factLabel}>
              <Users size={14} aria-hidden="true" /> Volunteers
            </dt>
            <dd className={styles.factValue}>
              {event.volunteersRegistered} registered of {event.volunteersNeeded} needed
            </dd>
          </div>
        </dl>
      </section>

      {plan && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>
                <Sparkles size={18} aria-hidden="true" /> Action plan
              </h2>
              <p className={styles.cardCaption}>
                Generated from this activity&rsquo;s feedback — what to keep, what to fix, and
                the checklist for the next one.
              </p>
            </div>
            <Button to={`/admin/action-plans/${event.eventId}`}>Open action plan</Button>
          </div>
        </section>
      )}

      <ThemeAverages feedback={feedback} />

      <AttendanceSheet event={event} feedback={feedback} />

      <section aria-labelledby="responses-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="responses-heading" className={styles.cardTitle}>
              What volunteers said
            </h2>
            <p className={styles.cardCaption}>
              Every response, newest first, with the comment exactly as it was written.
            </p>
          </div>
        </div>

        {feedback.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No feedback yet"
            message={
              collecting
                ? 'The form is open. Responses appear here as volunteers submit, without a refresh.'
                : 'This activity has not been held yet, so there is nothing to read.'
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

      <ActivityFormDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={saveEdits}
        companies={companies}
        initial={event}
      />
    </div>
  );
}
