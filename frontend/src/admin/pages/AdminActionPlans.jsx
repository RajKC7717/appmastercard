import { useState } from 'react';
import { Clock, Info, Sparkles } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { formatDate, formatDateTime } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Action plans — one per activity whose feedback window has closed.
 *
 * Every plan is read through `planFor()`, which returns a complete plan
 * or null. That is the fix for this page: it used to read
 * `plan.overallExperience.summary` straight off a mock that had a stub
 * entry with no `overallExperience` on it, so the page threw as soon as
 * data arrived — fine while loading, broken a moment later.
 *
 * The Generate button is a deliberate change from the original spec,
 * which said generation is backend-triggered only and no button should
 * exist. It was asked for, so it is here: it runs the same analysis the
 * backend job would, and records when it ran.
 */
export default function AdminActionPlans() {
  const { notify } = useToast();
  const {
    status,
    error,
    reload,
    planFor,
    planStateFor,
    createPlan,
    eventsWithPlans,
    eventsAwaitingPlan,
    eventsBlockedFromPlan,
  } = useConsoleData();

  const [busy, setBusy] = useState(null);

  const generate = async (event) => {
    setBusy(event.eventId);
    const result = await createPlan(event.eventId);
    setBusy(null);
    notify(
      result.ok
        ? { message: `Action plan ready for ${event.eventName}.` }
        : { message: result.error, tone: 'error' },
    );
  };

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
            Once an activity&rsquo;s feedback window closes, its responses are analysed into a
            plan: what to keep doing, what to fix, and a checklist for the next activity of the
            same kind. Every item carries the number of volunteers behind it and their own
            words. This is where past feedback turns into the next activity&rsquo;s plan.
          </p>
        </div>
      </header>

      {status === 'loading' ? (
        <Skeleton height={220} radius="md" />
      ) : (
        <>
          <section aria-labelledby="ready-heading">
            <div className={styles.cardHead}>
              <div>
                <h2 id="ready-heading" className={styles.cardTitle}>
                  Ready to act on
                </h2>
                <p className={styles.cardCaption}>
                  {eventsWithPlans.length} {eventsWithPlans.length === 1 ? 'plan' : 'plans'}{' '}
                  generated from volunteer feedback.
                </p>
              </div>
            </div>

            {eventsWithPlans.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No plans yet"
                message="Generate one below for any activity whose feedback window has closed. It takes a few seconds and reads every comment that activity received."
              />
            ) : (
              <div className={styles.stack}>
                {eventsWithPlans.map((event) => {
                  const plan = planFor(event.eventId);
                  const state = planStateFor(event.eventId);
                  const must = plan.actionPlan.filter((item) => item.bucket === 'must').length;
                  const should = plan.actionPlan.filter((item) => item.bucket === 'should').length;

                  return (
                    <article key={event.eventId} className={styles.card}>
                      <div className={styles.cardHead}>
                        <div>
                          <p className={styles.eyebrow}>
                            {event.companyName} · {formatDate(event.eventDate)}
                          </p>
                          <h3 className={styles.cardTitle}>{event.eventName}</h3>
                          <p className={styles.cardCaption}>{plan.overallExperience.summary}</p>
                        </div>
                        <Button to={`/admin/action-plans/${event.eventId}`}>Open plan</Button>
                      </div>

                      <div className={styles.row}>
                        {must > 0 && <Badge tone="must">{must} must have</Badge>}
                        {should > 0 && <Badge tone="should">{should} should have</Badge>}
                        {must === 0 && should === 0 && (
                          <Badge tone="success">Nothing to fix</Badge>
                        )}
                        {plan.previousActionPlanEvaluation?.improved && (
                          <Badge tone="success">Improved on last time</Badge>
                        )}
                        <span className={styles.muted}>
                          From {plan.responseCount} responses · scored{' '}
                          {plan.overallExperience.score}/5
                          {state.generatedAt
                            ? ` · generated ${formatDateTime(state.generatedAt)}`
                            : ` · analysed ${plan.analysisDate}`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {eventsAwaitingPlan.length > 0 && (
            <section className={styles.card} aria-labelledby="awaiting-heading">
              <div className={styles.cardHead}>
                <div>
                  <h2 id="awaiting-heading" className={styles.cardTitle}>
                    Ready to analyse
                  </h2>
                  <p className={styles.cardCaption}>
                    Feedback has closed on these and no plan has been produced yet.
                  </p>
                </div>
              </div>

              <ul className={styles.stack}>
                {eventsAwaitingPlan.map((event) => (
                  <li key={event.eventId} className={styles.row}>
                    <strong style={{ minWidth: 220 }}>{event.eventName}</strong>
                    <span className={styles.muted}>
                      {event.companyName} · {event.responses} responses · {event.comments} with a
                      comment
                    </span>
                    <span className={styles.spacer} />
                    <Button
                      icon={Sparkles}
                      onClick={() => generate(event)}
                      disabled={busy === event.eventId}
                    >
                      {busy === event.eventId ? 'Analysing…' : 'Generate action plan'}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {eventsBlockedFromPlan.length > 0 && (
            <section className={styles.card} aria-labelledby="blocked-heading">
              <div className={styles.cardHead}>
                <div>
                  <h2 id="blocked-heading" className={styles.cardTitle}>
                    <Clock size={18} aria-hidden="true" /> Not ready yet
                  </h2>
                  <p className={styles.cardCaption}>
                    Why each of these cannot be analysed — stated plainly rather than shown as a
                    button that does nothing.
                  </p>
                </div>
              </div>

              <ul className={styles.stackTight}>
                {eventsBlockedFromPlan.map((event) => (
                  <li key={event.eventId} className={styles.row}>
                    <Info size={14} aria-hidden="true" />
                    <strong style={{ minWidth: 220 }}>{event.eventName}</strong>
                    <span className={styles.muted}>{planStateFor(event.eventId).reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
