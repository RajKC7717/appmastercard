import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import ScoreGauge from '../../shared/ui/ScoreGauge.jsx';
import { EmptyState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import ActionItemCard from '../components/ActionItemCard.jsx';
import ChecklistGroup from '../components/ChecklistGroup.jsx';
import EmailDeliveryStatus from '../components/EmailDeliveryStatus.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { printReport } from '../../shared/lib/exports.js';
import { formatDate, formatDateTime } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

const BUCKETS = [
  { key: 'must', label: 'Must have', note: 'Fix before the next activity of this kind.' },
  { key: 'should', label: 'Should have', note: 'Worth doing, but it will not sink the next one.' },
  { key: 'could', label: 'Could have', note: 'Small improvements if there is capacity.' },
  { key: 'watch', label: 'Watch', note: 'Not enough volume to act on yet — check again next time.' },
];

const SEVERITY_TONE = { high: 'urgent', medium: 'should', low: 'watch' };

/**
 * One activity's action plan.
 *
 * The order is the argument: the score, then whether the last change
 * worked, then what went well, then what needs attention — each with the
 * evidence and the number of volunteers behind it — then the actions
 * sorted must / should / could / watch, then the checklist for next time.
 *
 * Evidence beside every claim is the whole point. "Volunteers were unsure
 * where to report" is an opinion; "24 of 31 mentions were negative, and
 * here are four of them in their own words" is something a coordinator
 * can take to a corporate partner.
 */
export default function AdminActionPlanDetail() {
  const { eventId } = useParams();
  const { notify } = useToast();
  const { status, findEvent, planFor, planStateFor, createPlan } = useConsoleData();
  const [busy, setBusy] = useState(false);

  const event = findEvent(eventId);
  const plan = planFor(eventId);
  const planState = planStateFor(eventId);

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <Skeleton height={24} width={180} />
        <Skeleton height={40} width="60%" />
        <Skeleton height={220} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon={Sparkles}
          title="That activity is not here"
          message="It may have been created on another device, or the link may be out of date."
          action={<Button to="/admin/action-plans">All action plans</Button>}
        />
      </div>
    );
  }

  const generate = async () => {
    setBusy(true);
    const result = await createPlan(eventId);
    setBusy(false);
    notify(
      result.ok
        ? { message: `Action plan ready for ${event.eventName}.` }
        : { message: result.error, tone: 'error' },
    );
  };

  /* No plan yet — say why, and offer the one action that changes that. */
  if (!plan) {
    return (
      <div className={styles.page}>
        <Link to="/admin/action-plans" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> All action plans
        </Link>
        <EmptyState
          icon={planState.eligible ? Sparkles : Clock}
          title={planState.eligible ? 'No plan for this activity yet' : 'Not ready to analyse'}
          message={
            planState.eligible
              ? `${event.responses} volunteers responded to ${event.eventName}. Generating the plan reads every comment and returns what to keep, what to fix, and a checklist for next time.`
              : planState.reason
          }
          action={
            planState.eligible ? (
              <Button icon={Sparkles} onClick={generate} disabled={busy}>
                {busy ? 'Analysing…' : 'Generate action plan'}
              </Button>
            ) : (
              <Button variant="secondary" to={`/admin/activities/${event.eventId}`}>
                Open the activity
              </Button>
            )
          }
        />
      </div>
    );
  }

  const insufficient = plan.generationState === 'insufficient_evidence';

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
            Built from {plan.responseCount} responses
            {plan.commentCount != null && `, ${plan.commentCount} of them with a written comment`}.
            {plan.generatedAt
              ? ` Generated ${formatDateTime(plan.generatedAt)}.`
              : ` Analysed ${plan.analysisDate}.`}
          </p>
        </div>
        <div className={`${styles.headActions} ${styles.noPrint}`}>
          <Button variant="secondary" to={`/admin/activities/${event.eventId}`}>
            Open the activity
          </Button>
          {plan.source === 'GENERATED' && (
            <Button variant="secondary" onClick={generate} disabled={busy}>
              {busy ? 'Re-analysing…' : 'Re-run analysis'}
            </Button>
          )}
          <Button onClick={printReport}>Print / save as PDF</Button>
        </div>
      </header>

      {insufficient ? (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Not enough written feedback</h2>
          <p className={styles.cardCaption} style={{ marginTop: 'var(--space-2)' }}>
            {plan.overallExperience.summary}
          </p>
          <p className={styles.finding}>
            Ratings alone give a score, not a reason. Saying so is more useful than inventing
            recommendations out of nine numbers.
          </p>
        </section>
      ) : (
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
                  <p className={styles.cardCaption}>
                    {plan.previousActionPlanEvaluation.result}
                  </p>
                </div>
                <Badge tone={plan.previousActionPlanEvaluation.improved ? 'success' : 'urgent'}>
                  {plan.previousActionPlanEvaluation.improved ? 'Improved' : 'Needs reassessment'}
                </Badge>
              </div>
              <p className={styles.finding}>{plan.previousActionPlanEvaluation.evidence}</p>
            </section>
          )}

          {plan.whatWentWell.length > 0 && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>What went well</h2>
              <p className={styles.cardCaption}>
                Keep doing these — they are why volunteers come back.
              </p>
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
          )}

          {plan.needsAttention.length > 0 && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <TriangleAlert size={18} aria-hidden="true" /> Needs attention
              </h2>
              <p className={styles.cardCaption}>
                Each one carries how many volunteers raised it, what they said, and what appears
                to be causing it.
              </p>
              <ul className={styles.stack} style={{ marginTop: 'var(--space-4)' }}>
                {plan.needsAttention.map((item) => (
                  <li key={item.problem} className={styles.stackTight}>
                    <div className={styles.row}>
                      <Badge tone={SEVERITY_TONE[item.severity] ?? 'watch'}>
                        {item.frequency} {item.frequency === 1 ? 'volunteer' : 'volunteers'}
                      </Badge>
                      <strong>{item.problem}</strong>
                      {item.ratedScore != null && (
                        <span className={styles.muted}>rated {item.ratedScore}/5</span>
                      )}
                    </div>
                    <span className={styles.muted}>{item.evidence}</span>
                    <span className={styles.muted}>Likely cause: {item.rootCause}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>What to do next</h2>
                <p className={styles.cardCaption}>
                  Sorted by how much difference each one makes, with an owner, a deadline and the
                  words it came from.
                </p>
              </div>
            </div>

            {plan.actionPlan.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nothing needs fixing"
                message="No theme came up negatively more than once, and no rated theme fell below 3.5. Run this activity the same way next time."
              />
            ) : (
              BUCKETS.map(({ key, label, note }) => {
                const items = plan.actionPlan.filter((item) => item.bucket === key);
                if (!items.length) return null;
                return (
                  <div key={key} className={styles.stack} style={{ marginBottom: 'var(--space-6)' }}>
                    <div>
                      <h3 className={styles.cardTitle}>{label}</h3>
                      <p className={styles.cardCaption}>{note}</p>
                    </div>
                    <div className={styles.grid2}>
                      {items.map((item) => (
                        <ActionItemCard key={`${item.bucket}-${item.priority}`} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {plan.nextEventChecklist.length > 0 && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h2 className={styles.cardTitle}>
                    <CalendarClock size={18} aria-hidden="true" /> Before the next one
                  </h2>
                  <p className={styles.cardCaption}>
                    {plan.nextEvent
                      ? `${plan.nextEvent.title} · ${plan.nextEvent.date}`
                      : `The must-haves and should-haves above, as a checklist for the next ${event.activityType.toLowerCase()} activity.`}
                  </p>
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
