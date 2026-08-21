import styles from './ProgressBar.module.css'

function ProgressBar({ percentage }) {
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${percentage}%` }} />
    </div>
  )
}

export default ProgressBar
