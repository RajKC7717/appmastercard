import styles from './ScoreGauge.module.css';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * One number, big, on its own surface. Used where a screen has a single
 * headline figure — the overall experience score for an activity.
 */
export default function ScoreGauge({ score, max = 5, label = 'Overall experience', caption }) {
  const fraction = Math.max(0, Math.min(1, score / max));
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className={styles.wrap}>
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        role="img"
        aria-label={`${label}: ${score} out of ${max}`}
      >
        <circle cx="70" cy="70" r={RADIUS} className={styles.track} strokeWidth="12" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={RADIUS}
          className={styles.fill}
          strokeWidth="12"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" className={styles.score}>
          {score}
        </text>
        <text x="70" y="88" textAnchor="middle" className={styles.max}>
          out of {max}
        </text>
      </svg>
      <span className={styles.label}>{label}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  );
}
