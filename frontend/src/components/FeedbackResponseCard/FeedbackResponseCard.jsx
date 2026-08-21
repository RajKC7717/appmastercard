import { Mail, TriangleAlert } from 'lucide-react'
import Button from '../Button/Button'
import styles from './FeedbackResponseCard.module.css'

function FeedbackResponseCard({ volunteers, responses, responseRate }) {
  const pending = volunteers - responses
  const isLow = responseRate < 50

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div>
          <h2>Feedback Response</h2>
          <p className={styles.muted}>
            {responses} of {volunteers} volunteers submitted feedback.
          </p>
        </div>
        <div className={styles.right}>
          <strong>{responseRate}%</strong>
          <Button icon={Mail}>Message Pending Volunteers</Button>
        </div>
      </div>

      {isLow && pending > 0 && (
        <div className={styles.warning}>
          <TriangleAlert size={18} />
          <div>
            <strong>Feedback response is below 50%</strong>
            <p>
              {pending} volunteer{pending > 1 ? 's have' : ' has'} not submitted their feedback yet.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default FeedbackResponseCard
