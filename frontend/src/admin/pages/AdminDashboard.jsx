import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarPlus,
  CalendarRange,
  Inbox,
  MessageSquareText,
} from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import Badge from '../../shared/ui/Badge.jsx';
import { EmptyState, ErrorState, EventCardSkeleton, Skeleton } from '../../shared/ui/States.jsx';
import EventListCard from '../../shared/console/EventListCard.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { INSIGHT_THEMES } from '../../shared/lib/insights.js';
import { formatDate, NOW, relativeDay } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * The admin's landing screen. Register B, archetype A — a work queue, not
 * a chart dashboard. The question in their head is "what needs me today?",
 * and the whole page is the answer to it, in priority order:
 *
 *   1. how many responses are still outstanding right now
 *   2. which concerns are recurring across activities — the "urgent" the
 *      problem statement says they cannot surface today
 *   3. the activities collecting feedback this minute
 *   4. what is coming up, and who is waiting on a reply
 *
 * Charts live in Themes and Reports. Someone who came here to work should
 * not have to walk past a bar chart to find their work.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const { status, error, reload, counts, collecting, upcoming, openNeeds, urgent, feedback } =
    useConsoleData();

  const loading = status === 'loading';

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const todaysResponses = feedback.filter(
    (row) => row.submittedAt.slice(0, 10) === NOW.toISOString().slice(0, 10),
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>{formatDate(NOW)}</p>
          <h1 className={styles.title}>Namaste, {user?.shortName}</h1>
          <p className={styles.caption}>
            {loading
              ? 'Checking what came in…'
              : counts.awaitingResponses > 0
                ? `${counts.awaitingResponses} volunteers from today's activities have not given feedback yet. The window closes at midnight.`
                : 'Every volunteer from today has responded. Nothing is outstanding.'}
          </p>
        </div>
        <div className={styles.headActions}>
          <Button to="/admin/activities?new=1" icon={CalendarPlus}>
            Create activity
          </Button>
        </div>
      </header>

      {/* Three numbers, not four, and the one that decides the next action
          is two to three times the size of the others. */}
      <section className={styles.counts} aria-label="Today at a glance">
        <div className={styles.countPrimary}>
          <span className={styles.countValue}>
            {loading ? <Skeleton height={40} width={72} /> : counts.awaitingResponses}
          </span>
          <span className={styles.countLabel}>Responses still to come in</span>
          <span className={styles.countHint}>
            Across {counts.collecting} {counts.collecting === 1 ? 'activity' : 'activities'}{' '}
            collecting feedback right now
          </span>
        </div>

        <div className={styles.count}>
          <span className={styles.countValue}>
            {loading ? <Skeleton height={26} width={44} /> : todaysResponses}
          </span>
          <span className={styles.countLabel}>Feedback received today</span>
          <span className={styles.countHint}>Every one is readable in full under Feedback</span>
        </div>

        <div className={styles.count}>
          <span className={`${styles.countValue} ${counts.flagged ? styles.countWarn : ''}`}>
            {loading ? <Skeleton height={26} width={32} /> : counts.flagged}
          </span>
          <span className={styles.countLabel}>Activities flagged</span>
          <span className={styles.countHint}>
            At least five volunteers, and a quarter of respondents, scored something 1 or 2
          </span>
        </div>
      </section>

      {/* "Surface urgent concerns" — the third thing the Foundation says
          it cannot do. A theme is urgent when several people said the same
          negative thing, not when one person was annoyed. */}
      {!loading && urgent.length > 0 && (
        <section className={styles.card} aria-labelledby="urgent-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="urgent-heading" className={styles.cardTitle}>
                <AlertTriangle size={18} aria-hidden="true" /> Recurring concerns
              </h2>
              <p className={styles.cardCaption}>
                Themes several volunteers raised negatively, across activities and partners.
                Each links to the comments it came from.
              </p>
            </div>
            <Button to="/admin/themes" variant="secondary">
              See all themes
            </Button>
          </div>

          <ul className={styles.stackTight}>
            {urgent.slice(0, 4).map((theme) => (
              <li key={theme.theme} className={styles.row}>
                <Badge tone="urgent">{theme.negative} negative</Badge>
                <Link to={`/admin/themes?theme=${theme.theme}`} className={styles.backLink}>
                  {INSIGHT_THEMES[theme.theme]}
                </Link>
                <span className={styles.muted}>
                  {theme.negativeShare}% of its {theme.total} mentions —{' '}
                  {theme.evidence[0]?.evidenceText}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="collecting-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="collecting-heading" className={styles.cardTitle}>
              Collecting feedback now
            </h2>
            <p className={styles.cardCaption}>
              Activities held today. The form is open until midnight, so the response rate here
              is still moving.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.stack}>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : collecting.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nothing is running today"
            message="When an activity moves to Happening now, it appears here with its response rate updating as volunteers submit."
            action={
              <Button to="/admin/activities" variant="secondary">
                See all activities
              </Button>
            }
          />
        ) : (
          <div className={styles.stack}>
            {collecting.map((event) => (
              <EventListCard key={event.eventId} event={event} basePath="/admin/activities" />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="upcoming-heading" className={styles.cardTitle}>
              Coming up
            </h2>
            <p className={styles.cardCaption}>
              The next activities on the calendar, with how full each one is.
            </p>
          </div>
          <Button to="/admin/activities" variant="secondary">
            All activities
          </Button>
        </div>

        {loading ? (
          <div className={styles.stack}>
            <EventCardSkeleton />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nothing scheduled yet"
            message="Create an activity and assign it to a corporate partner — volunteers see it the moment registration opens."
            action={<Button to="/admin/activities?new=1">Create activity</Button>}
          />
        ) : (
          <div className={styles.stack}>
            {[...upcoming]
              .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
              .slice(0, 3)
              .map((event) => (
                <EventListCard key={event.eventId} event={event} basePath="/admin/activities" />
              ))}
          </div>
        )}
      </section>

      <section className={styles.card} aria-labelledby="needs-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="needs-heading" className={styles.cardTitle}>
              <Inbox size={18} aria-hidden="true" /> Volunteer requests waiting
            </h2>
            <p className={styles.cardCaption}>
              Raised from the volunteer portal. The corporate SPOC answers these, but an
              unanswered one is the Foundation&rsquo;s problem too.
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton height={64} />
        ) : openNeeds.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="Nothing is waiting"
            message="Every request a volunteer raised has been answered by their SPOC."
          />
        ) : (
          <ul className={styles.stackTight}>
            {openNeeds.map((need) => (
              <li key={need.reference} className={styles.row}>
                <Badge tone="open" />
                <strong>{need.volunteerName}</strong>
                <span className={styles.muted}>
                  {need.companyName} · {need.eventName} · {relativeDay(need.raisedAt)}
                </span>
                <span className={styles.spacer} />
                <span className={styles.muted}>{need.note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
