import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import styles from './AlertBox.module.css'

function AlertBox({ variant = 'attention', title, message, recommendation }) {
  if (variant === 'success') {
    return (
      <div className={styles.success}>
        <CheckCircle2 size={20} />
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.attention}>
        <AlertTriangle size={20} />
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>

      {recommendation && (
        <div className={styles.recommendation}>
          <span>
            <Lightbulb size={14} /> Recommended Action
          </span>
          <p>{recommendation}</p>
        </div>
      )}
    </>
  )
}

export default AlertBox
