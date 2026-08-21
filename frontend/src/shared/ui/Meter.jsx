import styles from './Meter.module.css';

/**
 * A horizontal bar for a percentage. Always carries its number somewhere
 * on the row — the bar is the shape of the value, never the only statement
 * of it, so it still reads at a glance and still reads to a screen reader.
 */
export default function Meter({ percentage, tone = 'default', label }) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`${styles.fill} ${styles[tone] ?? ''}`} style={{ width: `${value}%` }} />
    </div>
  );
}
