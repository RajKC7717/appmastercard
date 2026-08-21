import styles from './ScoreGauge.module.css'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ScoreGauge({ score, max = 5 }) {
  const pct = Math.max(0, Math.min(1, score / max))
  const offset = CIRCUMFERENCE * (1 - pct)

  return (
    <div className={styles.wrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
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
        <text x="70" y="86" textAnchor="middle" className={styles.max}>
          / {max}
        </text>
      </svg>
      <span className={styles.label}>Overall Experience</span>
    </div>
  )
}

export default ScoreGauge
