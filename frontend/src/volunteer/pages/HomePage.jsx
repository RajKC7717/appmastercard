import { CalendarCheck, PartyPopper } from 'lucide-react';
import EventCard from '../components/EventCard.jsx';
import EventRail from '../components/EventRail.jsx';
import TutorialPanel from '../components/TutorialPanel.jsx';
import SpocNeeds from '../components/SpocNeeds.jsx';
import { EmptyState, EventCardSkeleton } from '../../shared/ui/States.jsx';
import Button from '../../shared/ui/Button.jsx';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import { spoc as fallbackSpoc, volunteer as fallbackVolunteer, TODAY } from '../data/demoData.js';
import { formatDate } from '../lib/format.js';
import styles from './HomePage.module.css';

/**
 * The question in the volunteer's head when they land here is "what needs
 * me?" — so the answer is the first line on the page, and the activities
 * that need something are the first thing under it.
 *
 * Active and upcoming are one list. Splitting them made the same person
 * check two places to answer one question, and today's activities carry
 * their own signal — a green card — without needing a separate section.
 *
 * The SPOC section sits last on purpose: it is what you reach for when
 * something is wrong, not what you came here to do.
 */
export default function HomePage() {
  const { status, volunteer, current, past, awaitingFeedback, activities, needs } =
    useVolunteer();
  const person = volunteer ?? fallbackVolunteer;
  const spoc = volunteer?.spoc ?? fallbackSpoc;
  const loading = status === 'loading';
  const waiting = awaitingFeedback.length;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.date}>{formatDate(TODAY)}</p>
        <h1 className={styles.greeting}>Namaste, {person.shortName}</h1>
        <p className={styles.answer}>
          {loading
            ? 'Checking your activities…'
            : waiting > 0
              ? `${waiting} ${waiting === 1 ? 'activity is' : 'activities are'} waiting for your feedback.`
              : 'You are all caught up. Nothing is waiting for your feedback.'}
        </p>
        <TutorialPanel />
      </header>

      <section className={styles.section} aria-labelledby="current-heading">
        <div className={styles.sectionHead}>
          <h2 id="current-heading" className={styles.sectionTitle}>
            Your activities
            {!loading && <span className={styles.count}>{current.length}</span>}
          </h2>
          <p className={styles.sectionCaption}>
            Today’s activities are marked in green — feedback for those closes at
            midnight. The rest are open for registration.
          </p>
        </div>

        {loading ? (
          <div className={styles.stack}>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : current.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nothing scheduled right now"
            message="When your SPOC adds you to a drive it appears here, and on the day you attend it turns green with a feedback button."
            action={
              <Button to="/volunteer/history" variant="secondary">
                See your past feedback
              </Button>
            }
          />
        ) : (
          <div className={styles.stack}>
            {current.map((activity) => (
              <EventCard key={activity.activityId} activity={activity} layout="stack" />
            ))}
          </div>
        )}

        {!loading && current.length > 0 && waiting === 0 && (
          <p className={styles.allDone}>
            <PartyPopper className={styles.allDoneIcon} aria-hidden="true" />
            You have given feedback for every activity today. Thank you — the
            coordinators read every one.
          </p>
        )}
      </section>

      {!loading && (
        <EventRail
          title="Past"
          caption="Activities you attended and gave feedback for."
          events={past}
          seeAllTo="/volunteer/events?filter=past"
          emptyMessage="Once you give feedback for an activity, it collects here."
        />
      )}

      {!loading && <SpocNeeds spoc={spoc} activities={activities} needs={needs} />}
    </div>
  );
}
