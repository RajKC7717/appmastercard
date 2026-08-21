import styles from './StatTile.module.css';

/**
 * One number and what it means. The console equivalent of a volunteer's
 * event card: same surface, same border, same shadow, same radius — only
 * the payload differs.
 *
 * `tone` marks a number that needs reading twice ('warn' for a figure
 * below target). It tints the value, never the whole tile: a wall of
 * coloured tiles stops meaning anything.
 */
export default function StatTile({ label, value, hint, icon: Icon, tone = 'default' }) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>
        {Icon && <Icon className={styles.icon} aria-hidden="true" />}
        {label}
      </span>
      <strong className={`${styles.value} ${styles[tone] ?? ''}`}>{value}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
