import { Sparkles } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { ACTION_PLAN_FOR_EVENT } from '../data/actionPlanIndex.js';
import { formatDate } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Action plans, one per activity whose feedback window has closed.
 *
 * There is deliberately no "Generate action plan" button anywhere. A plan
 * is produced by the backend when a feedback period closes, and inventing
 * a button for it here would advertise a capability the console does not
 * have. This page reads; it does not trigger.
 */
export default function AdminActionPlans() {
  const { status, error, reload, summarised } = useConsoleData();

  const withPlans = summarised
    .filter((event) => ACTION_PLAN_FOR_EVENT[event.eventId])
    .map((event) => ({ ...event, plan: ACTION_PLAN_FOR_EVENT[event.eventId] }));

  const awaiting = summarised.filter(
    (event) => event.status === 'ONGOING' || (event.status === 'COMPLETED' && !ACTION_PLAN_FOR_EVENT[event.eventId]),
  );

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Action plans</h1>
          <p className={styles.caption}>
            When an activity&rsquo;s feedback window closes, its responses are analysed into a
            plan: what to keep doing, what to fix, and a checklist for the next activity of the
            same kind. This is where &ldquo;reuse historical learning when planning future
            activities&rdquo; actually happens.
          </p>
        </div>
      </header>

      {status === 'loading' ? (
        <Skeleton height={220} radius="md" />
      ) : withPlans.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No plans yet"
          message="A plan appears here once an activity's feedback window has closed and its responses have been analysed."
        />
      ) : (
        <div className={styles.stack}>
          {withPlans.map((event) => {
            const { plan } = event;
            const must = plan.actionPlan.filter((item) => item.bucket === 'must').length;
            const should = plan.actionPlan.filter((item) => item.bucket === 'should').length;

            return (
              <article key={event.eventId} className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <p className={styles.eyebrow}>
                      {event.companyName} · {formatDate(event.eventDate)}
                    </p>
                    <h2 className={styles.cardTitle}>{event.eventName}</h2>
                    <p className={styles.cardCaption}>{plan.overallExperience.summary}</p>
                  </div>
                  <Button to={`/admin/action-plans/${event.eventId}`}>Open plan</Button>
                </div>

                <div className={styles.row}>
                  <Badge tone="must">{must} must have</Badge>
                  <Badge tone="should">{should} should have</Badge>
                  <span className={styles.muted}>
                    From {plan.responseCount} responses · scored{' '}
                    {plan.overallExperience.score}/5 · analysed {plan.analysisDate}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {awaiting.length > 0 && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Waiting on analysis</h2>
              <p className={styles.cardCaption}>
                These activities have feedback but no plan yet. Analysis runs after the feedback
                window closes — it is not something anyone triggers by hand.
              </p>
            </div>
          </div>
          <ul className={styles.stackTight}>
            {awaiting.map((event) => (
              <li key={event.eventId} className={styles.row}>
                <strong style={{ minWidth: 220 }}>{event.eventName}</strong>
                <span className={styles.muted}>
                  {event.companyName} · {event.responses} responses ·{' '}
                  {event.status === 'ONGOING' ? 'still collecting' : 'queued for analysis'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
