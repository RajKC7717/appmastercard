import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CheckCircle2, Sparkles, TriangleAlert } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import ScoreGauge from '../../shared/ui/ScoreGauge.jsx';
import { EmptyState, Skeleton } from '../../shared/ui/States.jsx';
import ActionItemCard from '../components/ActionItemCard.jsx';
import ChecklistGroup from '../components/ChecklistGroup.jsx';
import EmailDeliveryStatus from '../components/EmailDeliveryStatus.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { ACTION_PLAN_FOR_EVENT } from '../data/actionPlanIndex.js';
import { printReport } from '../../shared/lib/exports.js';
import { formatDate } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

const BUCKETS = [
  { key: 'must', label: 'Must have' },
  { key: 'should', label: 'Should have' },
  { key: 'could', label: 'Could have' },
  { key: 'watch', label: 'Watch' },
];

const STATE_MESSAGE = {
  pending: 'Analysing the responses. The plan appears here automatically when it finishes.',
  insufficient_evidence:
    'Too few written comments to draw a conclusion from. Ratings alone give a score, not a reason.',
  failed: 'The analysis did not complete. It retries on its own — nothing has been lost.',
};

/**
 * One activity's action plan.
 *
 * The order is the argument: the score, then what worked, then what did
 * not — each with the evidence and the number of volunteers behind it —
 * then the actions sorted into must / should / could / watch, then the
 * checklist for the next activity.
 *
 * Evidence beside every claim is the whole point. "Volunteers were unsure
 * where to report" is an opinion; "24 responses said the same thing in
 * different words" is something a coordinator can take to a partner.
 */
export default function AdminActionPlanDetail() {
  const { eventId } = useParams();
  const { status, findEvent } = useConsoleData();

  const event = findEvent(eventId);
  const plan = ACTION_PLAN_FOR_EVENT[eventId];

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <Skeleton height={24} width={180} />
        <Skeleton height={40} width="60%" />
        <Skeleton height={220} />
      </div>
    );
  }

  if (!event || !plan) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={Sparkles}
          title="No plan for this activity"
          message="A plan is generated once the activity's feedback window has closed."
          action={<Button to="/admin/action-plans">All action plans</Button>}
        />
      </div>
    );
  }

  const generated = plan.generationState === 'generated';

  return (
    <div className={styles.page}>
      <Link to="/admin/action-plans" className={`${styles.backLink} ${styles.noPrint}`}>
        <ArrowLeft size={16} aria-hidden="true" /> All action plans
      </Link>

      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>
            <Sparkles size={14} aria-hidden="true" /> Action plan · {event.companyName} ·{' '}
            {formatDate(event.eventDate)}
          </p>
          <h1 className={styles.title}>{event.eventName}</h1>
          <p className={styles.caption}>
            Built from {plan.responseCount} responses, analysed {plan.analysisDate}.
          </p>
        </div>
        <div className={`${styles.headActions} ${styles.noPrint}`}>
          <Button variant="secondary" to={`/admin/activities/${event.eventId}`}>
            Open the activity
          </Button>
          <Button onClick={printReport}>Print / save as PDF</Button>
        </div>
      </header>

      {!generated && (
        <section className={styles.card}>
          <p>{STATE_MESSAGE[plan.generationState] ?? 'This plan is not ready yet.'}</p>
        </section>
      )}

      {generated && (
        <>
          {plan.emailDelivery && (
            <div className={styles.noPrint}>
              <EmailDeliveryStatus delivery={plan.emailDelivery} />
            </div>
          )}

          <section className={styles.split}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>What the feedback says</h2>
              <p className={styles.cardCaption} style={{ marginTop: 'var(--space-2)' }}>
                {plan.overallExperience.summary}
              </p>
            </div>
            <div className={styles.card}>
              <ScoreGauge
                score={plan.overallExperience.score}
                caption={`Across ${plan.responseCount} responses`}
              />
            </div>
          </section>

          {plan.previousActionPlanEvaluation?.available && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <CheckCircle2 size={18} aria-hidden="true" /> Did the last change work?
                  </h2>
                  <p className={styles.cardCaption}>{plan.previousActionPlanEvaluation.result}</p>
                </div>
                <Badge tone={plan.previousActionPlanEvaluation.improved ? 'success' : 'urgent'}>
                  {plan.previousActionPlanEvaluation.improved ? 'Improved' : 'Needs reassessment'}
                </Badge>
              </div>
              <p className={styles.finding}>{plan.previousActionPlanEvaluation.evidence}</p>
            </section>
          )}

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>What went well</h2>
            <p className={styles.cardCaption}>Keep doing these — they are why volunteers return.</p>
            <ul className={styles.stack} style={{ marginTop: 'var(--space-4)' }}>
              {plan.whatWentWell.map((item) => (
                <li key={item.observation} className={styles.stackTight}>
                  <strong>{item.observation}</strong>
                  <span className={styles.muted}>{item.evidence}</span>
                  <span className={styles.muted}>{item.impact}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <TriangleAlert size={18} aria-hidden="true" /> Needs attention
            </h2>
            <p className={styles.cardCaption}>
              Each one carries how many volunteers raised it and what appears to be causing it.
            </p>
            <ul className={styles.stack} style={{ marginTop: 'var(--space-4)' }}>
              {plan.needsAttention.map((item) => (
                <li key={item.problem} className={styles.stackTight}>
                  <div className={styles.row}>
                    <Badge tone={item.severity === 'high' ? 'urgent' : item.severity === 'medium' ? 'should' : 'watch'}>
                      {item.frequency} responses
                    </Badge>
                    <strong>{item.problem}</strong>
                  </div>
                  <span className={styles.muted}>{item.evidence}</span>
                  <span className={styles.muted}>Root cause: {item.rootCause}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>What to do next</h2>
                <p className={styles.cardCaption}>
                  Sorted by how much difference each one makes, with an owner and a deadline.
                </p>
              </div>
            </div>

            {BUCKETS.map(({ key, label }) => {
              const items = plan.actionPlan.filter((item) => item.bucket === key);
              if (!items.length) return null;
              return (
                <div key={key} className={styles.stack} style={{ marginBottom: 'var(--space-6)' }}>
                  <h3 className={styles.cardTitle}>{label}</h3>
                  <div className={styles.grid2}>
                    {items.map((item) => (
                      <ActionItemCard key={item.priority} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {plan.nextEventChecklist?.length > 0 && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <CalendarClock size={18} aria-hidden="true" /> Before the next one
                  </h2>
                  {plan.nextEvent && (
                    <p className={styles.cardCaption}>
                      {plan.nextEvent.title} · {plan.nextEvent.date}
                    </p>
                  )}
                </div>
              </div>
              <ChecklistGroup items={plan.nextEventChecklist} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
