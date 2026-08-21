import styles from './ProgressRule.module.css';

/**
 * A thin rule across the top that fills as each card is answered.
 *
 * It names the phase rather than only counting, and the total is five —
 * a small, reassuring number that is honest to state. Early progress is
 * fast by design: one emoji tap moves it a fifth of the way.
 */
export default function ProgressRule({ completed, total, phase }) {
  const percent = Math.round((completed / total) * 100);

  return (
    <div className={styles.wrap}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} answered`}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.labels}>
        <span className={styles.phase}>{phase}</span>
        <span className={styles.count}>
          {completed} of {total}
        </span>
      </div>
    </div>
  );
}
