import styles from './Badge.module.css';

/**
 * ONE status system for the whole app. A colour means the same thing on
 * every screen and always carries its word, so status is never signalled by
 * colour alone.
 *
 * There is deliberately no "happening today" tone: an activity held today
 * already reads as today from the green card it sits on, and a badge saying
 * the same thing again is noise on the one card that most needs to be clear.
 */
const TONES = {
  needed: 'Feedback needed',
  done: 'Feedback given',
  registered: 'You’re registered',
  full: 'Full',
  upcoming: 'Upcoming',
  past: 'Completed',
  urgent: 'Flagged for follow-up',
  open: 'Open',
  resolved: 'Resolved',
};

export default function Badge({ tone = 'neutral', children, icon: Icon, dot = false }) {
  return (
    <span className={`${styles.badge} ${styles[tone] || styles.neutral}`}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      {children ?? TONES[tone]}
    </span>
  );
}
