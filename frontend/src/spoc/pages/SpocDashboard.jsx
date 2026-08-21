import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarPlus, Inbox, Users } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { EmptyState, ErrorState, EventCardSkeleton, Skeleton } from '../../shared/ui/States.jsx';
import EventListCard from '../../shared/console/EventListCard.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { INSIGHT_THEMES } from '../../shared/lib/insights.js';
import { formatDate, NOW, relativeDay } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * The SPOC's landing screen — problem statement K: "view upcoming
 * activities and volunteering needs for the same."
 *
 * The question in a SPOC's head is not "how are we scoring?" — it is
 * "have I got enough people signed up for what is coming?" So the primary
 * number is the shortfall across upcoming activities, and the list under
 * it is sorted by how soon each one happens.
 *
 * Experience scores live one click away, in Feedback themes. They matter
 * to a SPOC monthly; the shortfall matters this week.
 */
export default function SpocDashboard() {
  const { user } = useAuth();
  const { status, error, reload, upcoming, collecting, openNeeds, urgent, summarised } =
    useConsoleData();

  const loading = status === 'loading';

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const shortfall = upcoming.reduce(
    (sum, event) => sum + Math.max(0, event.volunteersNeeded - event.volunteersRegistered),
    0,
  );
  const engaged = summarised.reduce((sum, event) => sum + event.volunteersRegistered, 0);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>
            {user?.companyName} · {formatDate(NOW)}
          </p>
          <h1 className={styles.title}>Namaste, {user?.shortName}</h1>
          <p className={styles.caption}>
            {loading
              ? 'Checking what is coming up…'
              : shortfall > 0
                ? `${shortfall} more volunteers are needed across your upcoming activities.`
                : 'Every upcoming activity is fully staffed. Nothing needs chasing.'}
          </p>
        </div>
      </header>

      <section className={styles.counts} aria-label="Your company at a glance">
        <div className={styles.countPrimary}>
          <span className={styles.countValue}>
            {loading ? <Skeleton height={40} width={64} /> : shortfall}
          </span>
          <span className={styles.countLabel}>More volunteers needed</span>
          <span className={styles.countHint}>
            Across {upcoming.length} upcoming {upcoming.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>

        <div className={styles.count}>
          <span className={styles.countValue}>
            {loading ? <Skeleton height={26} width={40} /> : openNeeds.length}
          </span>
          <span className={styles.countLabel}>Requests waiting on you</span>
          <span className={styles.countHint}>Raised by your volunteers from the portal</span>
        </div>

        <div className={styles.count}>
          <span className={styles.countValue}>
            {loading ? <Skeleton height={26} width={40} /> : engaged}
          </span>
          <span className={styles.countLabel}>Volunteer participations</span>
          <span className={styles.countHint}>Registrations across every activity so far</span>
        </div>
      </section>

      {!loading && openNeeds.length > 0 && (
        <section className={styles.card} aria-labelledby="needs-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="needs-heading" className={styles.cardTitle}>
                <Inbox size={18} aria-hidden="true" /> Volunteering needs raised
              </h2>
              <p className={styles.cardCaption}>
                Your volunteers asked for these from the portal. Each one is waiting for an
                answer from you.
              </p>
            </div>
            <Button to="/spoc/requests">Answer them</Button>
          </div>

          <ul className={styles.stackTight}>
            {openNeeds.slice(0, 4).map((need) => (
              <li key={need.reference} className={styles.row}>
                <Badge tone="open" />
                <strong>{need.volunteerName}</strong>
                <span className={styles.muted}>
                  {need.eventName} · {relativeDay(need.raisedAt)}
                </span>
                <span className={styles.spacer} />
                <span className={styles.muted}>{need.note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && urgent.length > 0 && (
        <section className={styles.card} aria-labelledby="urgent-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="urgent-heading" className={styles.cardTitle}>
                <AlertTriangle size={18} aria-hidden="true" /> What your volunteers keep raising
              </h2>
              <p className={styles.cardCaption}>
                Themes several of your people mentioned negatively. Worth taking to Seva Sahayog
                before the next activity.
              </p>
            </div>
            <Button to="/spoc/insights" variant="secondary">
              See all themes
            </Button>
          </div>
          <ul className={styles.stackTight}>
            {urgent.slice(0, 3).map((theme) => (
              <li key={theme.theme} className={styles.row}>
                <Badge tone="urgent">{theme.negative} negative</Badge>
                <Link to={`/spoc/insights?theme=${theme.theme}`} className={styles.backLink}>
                  {INSIGHT_THEMES[theme.theme]}
                </Link>
                <span className={styles.muted}>{theme.evidence[0]?.evidenceText}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="upcoming-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="upcoming-heading" className={styles.cardTitle}>
              Coming up
            </h2>
            <p className={styles.cardCaption}>
              Soonest first, with how many places are still open on each.
            </p>
          </div>
          <Button to="/spoc/activities" variant="secondary">
            All activities
          </Button>
        </div>

        {loading ? (
          <div className={styles.stack}>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nothing scheduled yet"
            message="Seva Sahayog creates activities for your company. They appear here the moment registration opens, and your volunteers see them at the same time."
          />
        ) : (
          <div className={styles.stack}>
            {[...upcoming]
              .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
              .map((event) => (
                <EventListCard
                  key={event.eventId}
                  event={event}
                  basePath="/spoc/activities"
                  showCompany={false}
                />
              ))}
          </div>
        )}
      </section>

      {!loading && collecting.length > 0 && (
        <section aria-labelledby="today-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="today-heading" className={styles.cardTitle}>
                <Users size={18} aria-hidden="true" /> Happening today
              </h2>
              <p className={styles.cardCaption}>
                Feedback is open until midnight. A nudge in the group chat is the single most
                effective thing you can do for the response rate.
              </p>
            </div>
          </div>
          <div className={styles.stack}>
            {collecting.map((event) => (
              <EventListCard
                key={event.eventId}
                event={event}
                basePath="/spoc/activities"
                showCompany={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
