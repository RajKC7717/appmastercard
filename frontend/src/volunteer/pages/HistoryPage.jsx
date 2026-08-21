import { MessageSquareText } from 'lucide-react';
import FeedbackRecord from '../components/FeedbackRecord.jsx';
import { EmptyState, Skeleton } from '../components/ui/States.jsx';
import Button from '../components/ui/Button.jsx';
import { useVolunteer } from '../state/VolunteerProvider.jsx';
import { LOW_RATING_THRESHOLD } from '../data/questions.js';
import styles from './HistoryPage.module.css';

/**
 * Every piece of feedback this volunteer has given, newest first. Three
 * numbers at the top — no more — and each one is something they can act on
 * or be proud of, not a vanity tile.
 */
export default function HistoryPage() {
  const { status, feedback, findActivity, awaitingFeedback } = useVolunteer();
  const loading = status === 'loading';

  const total = feedback.length;

  /* Every rating across every submission — nine per feedback. */
  const allRatings = feedback.flatMap((f) => Object.values(f.ratings ?? {}));
  const average = allRatings.length
    ? (allRatings.reduce((sum, n) => sum + n, 0) / allRatings.length).toFixed(1)
    : '—';
  /* A score of 2 or below is the one the coordinator has to act on. */
  const flagged = allRatings.filter((n) => n <= LOW_RATING_THRESHOLD).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.heading}>Your feedback</h1>
        <p className={styles.caption}>
          Everything you have shared after an activity. Coordinators see the same
          record you do.
        </p>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statPrimary}`}>
          <span className={styles.statValue}>{loading ? <Skeleton height={38} width={56} /> : total}</span>
          <span className={styles.statLabel}>Feedbacks given</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {loading ? <Skeleton height={26} width={44} /> : average}
          </span>
          <span className={styles.statLabel}>Average score you gave</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {loading ? <Skeleton height={26} width={30} /> : flagged}
          </span>
          <span className={styles.statLabel}>Low scores you flagged</span>
        </div>
      </div>

      {!loading && awaitingFeedback.length > 0 && (
        <div className={styles.nudge}>
          <p>
            {awaitingFeedback.length}{' '}
            {awaitingFeedback.length === 1 ? 'activity from today is' : 'activities from today are'}{' '}
            still waiting for your feedback.
          </p>
          <Button to="/volunteer" variant="secondary">
            Go to today
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((key) => (
            <div key={key} className={styles.recordSkeleton}>
              <Skeleton height={52} width={52} radius="pill" />
              <div className={styles.recordSkeletonText}>
                <Skeleton height={22} width="60%" />
                <Skeleton height={16} width="40%" />
              </div>
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No feedback yet"
          message="After you attend an activity, it appears on your home page with a feedback button. What you share lands here."
          action={
            <Button to="/volunteer" variant="primary">
              Go to today
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {feedback.map((record) => (
            <FeedbackRecord
              key={record.reference}
              feedback={record}
              activity={findActivity(record.activityId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
