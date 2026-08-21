import styles from './Badge.module.css'

const toneClass = {
  must: styles.must,
  should: styles.should,
  could: styles.could,
  watch: styles.watch,
  success: styles.success,
  error: styles.error,
  neutral: styles.neutral,
}

function Badge({ tone = 'neutral', children }) {
  return <span className={`${styles.badge} ${toneClass[tone] ?? styles.neutral}`}>{children}</span>
}

export default Badge
