import styles from './SummaryCard.module.css'

function SummaryCard({ label, value }) {
  return (
    <div className={styles.card}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default SummaryCard
