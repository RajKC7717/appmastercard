import { useState } from 'react';
import { Inbox, Phone, Send } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import { Field, TextArea } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { INSIGHT_THEMES } from '../../shared/lib/insights.js';
import { formatDateTime, relativeDay } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * The other end of the volunteer portal's "raise a need" flow.
 *
 * A volunteer taps "I need transport" on their phone; it lands here, with
 * their name against it, and the SPOC's reply goes back to the same
 * screen they raised it from. That is the loop — someone asks, someone
 * answers, and both can see it later — and it is the thing a WhatsApp
 * group genuinely cannot do, because the answer scrolls away.
 *
 * The need categories are InsightTheme values, so a request for transport
 * and a complaint about transport in a comment land in the same reporting
 * bucket rather than two disconnected lists.
 */
export default function SpocRequests() {
  const { notify } = useToast();
  const { status, error, reload, needs, respondToNeed } = useConsoleData();
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(null);
  const [failure, setFailure] = useState({});

  const open = needs.filter((need) => need.status === 'OPEN');
  const answered = needs.filter((need) => need.status !== 'OPEN');

  const send = async (need) => {
    const reply = (drafts[need.reference] ?? '').trim();
    if (!reply) {
      setFailure((current) => ({
        ...current,
        [need.reference]: 'Write a reply before sending it.',
      }));
      return;
    }

    setBusy(need.reference);
    const result = await respondToNeed(need.reference, reply);
    setBusy(null);

    if (!result.ok) {
      setFailure((current) => ({ ...current, [need.reference]: result.error }));
      return;
    }

    setDrafts((current) => ({ ...current, [need.reference]: '' }));
    setFailure((current) => ({ ...current, [need.reference]: undefined }));
    notify({ message: `Replied to ${need.volunteerName}. They see it in their portal.` });
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
          <h1 className={styles.title}>Volunteer requests</h1>
          <p className={styles.caption}>
            Raised by your volunteers from their portal — transport, materials, safety and
            access. Your reply appears on the request they raised, so nothing gets lost in a
            group chat.
          </p>
        </div>
      </header>

      <section className={styles.counts} aria-label="Requests">
        <div className={styles.countPrimary}>
          <span className={styles.countValue}>
            {status === 'loading' ? <Skeleton height={40} width={48} /> : open.length}
          </span>
          <span className={styles.countLabel}>Waiting for your reply</span>
          <span className={styles.countHint}>
            {open.length === 0 ? 'Nothing outstanding' : 'Oldest first below'}
          </span>
        </div>
        <div className={styles.count}>
          <span className={styles.countValue}>{answered.length}</span>
          <span className={styles.countLabel}>Answered</span>
          <span className={styles.countHint}>Kept as a record for future planning</span>
        </div>
      </section>

      <section aria-labelledby="open-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="open-heading" className={styles.cardTitle}>
              Open requests
            </h2>
          </div>
        </div>

        {status === 'loading' ? (
          <Skeleton height={200} radius="md" />
        ) : open.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing is waiting"
            message="Every request your volunteers raised has an answer. New ones appear here the moment they are raised."
          />
        ) : (
          <div className={styles.stack}>
            {[...open]
              .sort((a, b) => new Date(a.raisedAt) - new Date(b.raisedAt))
              .map((need) => (
                <article key={need.reference} className={styles.card}>
                  <div className={styles.cardHead}>
                    <div>
                      <div className={styles.row}>
                        <Badge tone="open" />
                        {need.categories.map((category) => (
                          <Badge key={category} tone="upcoming">
                            {INSIGHT_THEMES[category] ?? category}
                          </Badge>
                        ))}
                      </div>
                      <h3 className={styles.cardTitle} style={{ marginTop: 'var(--space-2)' }}>
                        {need.volunteerName}
                      </h3>
                      <p className={styles.cardCaption}>
                        {need.eventName} · raised {relativeDay(need.raisedAt)} ·{' '}
                        {need.reference}
                      </p>
                    </div>
                  </div>

                  <blockquote className={styles.finding}>{need.note}</blockquote>

                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <Field
                      label={`Reply to ${need.volunteerName}`}
                      htmlFor={`reply-${need.reference}`}
                      error={failure[need.reference]}
                      hint="One or two lines. They see this on the request in their portal."
                    >
                      <TextArea
                        id={`reply-${need.reference}`}
                        rows={3}
                        value={drafts[need.reference] ?? ''}
                        invalid={Boolean(failure[need.reference])}
                        onChange={(changeEvent) =>
                          setDrafts((current) => ({
                            ...current,
                            [need.reference]: changeEvent.target.value,
                          }))
                        }
                        placeholder="Pickup confirmed from the Wagholi side at 7:15 am."
                      />
                    </Field>

                    <div className={styles.row}>
                      <Button
                        icon={Send}
                        onClick={() => send(need)}
                        disabled={busy === need.reference}
                      >
                        {busy === need.reference ? 'Sending…' : 'Send reply'}
                      </Button>
                      <a href={`tel:+91${need.volunteerPhone ?? ''}`} className={styles.backLink}>
                        <Phone size={14} aria-hidden="true" /> Call instead
                      </a>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>

      {answered.length > 0 && (
        <section className={styles.card} aria-labelledby="answered-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="answered-heading" className={styles.cardTitle}>
                Already answered
              </h2>
              <p className={styles.cardCaption}>
                Kept on purpose. &ldquo;We added a Wagholi stop last season&rdquo; is exactly the
                historical learning that gets lost today.
              </p>
            </div>
          </div>

          <ul className={styles.stack}>
            {answered.map((need) => (
              <li key={need.reference} className={styles.stackTight}>
                <div className={styles.row}>
                  <Badge tone="resolved" />
                  <strong>{need.volunteerName}</strong>
                  <span className={styles.muted}>
                    {need.eventName} · {formatDateTime(need.raisedAt)}
                  </span>
                </div>
                <p className={styles.muted}>Asked: {need.note}</p>
                <p>Answered: {need.response}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
