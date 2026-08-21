import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mail, Sparkles } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { closedLoop } from '../../data/demoData.js';
import { maskEmail } from '../../lib/format.js';
import styles from './SuccessDialog.module.css';

const REDIRECT_SECONDS = 8;

/**
 * Confirmation, required by use case G — and the emotional beat of the
 * whole flow.
 *
 * Three things, in order of what the volunteer cares about:
 *   1. it worked, and where the receipt went
 *   2. a reference they can read aloud to a coordinator
 *   3. what changed because of the last round of feedback
 *
 * That third block is the reason volunteers come back. It is also the only
 * honest answer to "you collect feedback, but does anything happen?"
 */
export default function SuccessDialog({ reference, activity, confirmationEmail, onClose }) {
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS);
  const dialogRef = useRef(null);
  const loop = closedLoop[activity.activityType];

  /* Focus the dialog so a keyboard or screen-reader user lands inside it. */
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /* Counts down to the home page, and says so — never a silent redirect. */
  useEffect(() => {
    if (remaining <= 0) {
      onClose();
      return undefined;
    }
    const timer = window.setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining, onClose]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-title"
        tabIndex={-1}
      >
        <span className={styles.tick}>
          <CheckCircle2 aria-hidden="true" />
        </span>

        <h2 id="success-title" className={styles.title}>
          Thank you, that is recorded
        </h2>

        <p className={styles.body}>
          Your feedback for <strong>{activity.name}</strong> has reached the Seva
          Sahayog coordinator for this activity.
        </p>

        {/* Only claimed when the server actually accepted the mail. Saying
            "email sent" when it silently failed is worse than saying nothing. */}
        <p className={`${styles.email} ${confirmationEmail?.sent ? '' : styles.emailPending}`}>
          <Mail className={styles.emailIcon} aria-hidden="true" />
          {confirmationEmail?.sent ? (
            <>
              A confirmation email has been sent to{' '}
              <strong>{maskEmail(confirmationEmail.to)}</strong>
            </>
          ) : (
            <>Your feedback is saved. The confirmation email is on its way.</>
          )}
        </p>

        <div className={styles.reference}>
          <span className={styles.referenceLabel}>Your reference</span>
          <span className={styles.referenceValue}>{reference}</span>
          <span className={styles.referenceHint}>
            Read this out to your coordinator if you need to follow up.
          </span>
        </div>

        {loop && (
          <div className={styles.loop}>
            <p className={styles.loopHead}>
              <Sparkles className={styles.loopIcon} aria-hidden="true" />
              Because of feedback like yours
            </p>
            <p className={styles.loopBody}>
              Volunteers told us {loop.said}. We {loop.changed}.
            </p>
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={onClose}>
          Back to home
        </Button>

        <p className={styles.countdown} role="status">
          Taking you home in {remaining} {remaining === 1 ? 'second' : 'seconds'}
        </p>
      </div>
    </div>
  );
}
