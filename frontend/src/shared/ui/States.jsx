import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import styles from './States.module.css';

/**
 * The three non-loaded states, all in one file so nobody can ship a screen
 * with only two of them. Each occupies the same footprint as the real
 * content, so nothing shifts when data arrives.
 */

/** A grey block that matches the shape of what is coming. Never a spinner. */
export function Skeleton({ height = 16, width = '100%', radius = 'sm', className = '' }) {
  return (
    <span
      className={`${styles.skeleton} ${styles[radius]} ${className}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}

/** Matches EventCard's footprint exactly. */
export function EventCardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.skelRow}>
        <Skeleton height={20} width={84} radius="pill" />
        <Skeleton height={20} width={64} radius="pill" />
      </div>
      <Skeleton height={24} width="70%" />
      <Skeleton height={16} width="52%" />
      <Skeleton height={16} width="44%" />
      <Skeleton height={48} width="100%" radius="md" />
    </div>
  );
}

/** An invitation, never "No data". */
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className={styles.state}>
      {Icon && (
        <span className={styles.emptyIcon}>
          <Icon aria-hidden="true" />
        </span>
      )}
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateMessage}>{message}</p>
      {action}
    </div>
  );
}

/** Says what happened and what to do. Never apologises, never blames. */
export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.state} role="alert">
      <span className={`${styles.emptyIcon} ${styles.errorIcon}`}>
        <AlertCircle aria-hidden="true" />
      </span>
      <h3 className={styles.stateTitle}>{message}</h3>
      <p className={styles.stateMessage}>
        Check your connection and try again. Nothing you entered has been lost.
      </p>
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
