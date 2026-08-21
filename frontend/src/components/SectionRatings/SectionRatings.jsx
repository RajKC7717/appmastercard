import { Star } from 'lucide-react'
import ProgressBar from '../ProgressBar/ProgressBar'
import styles from './SectionRatings.module.css'

function SectionRatings({ sections, responses }) {
  return (
    <section className={styles.card}>
      <h2>Feedback by Section</h2>
      <p className={styles.muted}>Ratings received for each feedback area</p>

      <div className={styles.list}>
        {sections.map((section) => (
          <div className={styles.row} key={section.label}>
            <div className={styles.label}>
              <strong>{section.label}</strong>
              <span>{responses} responses</span>
            </div>
            <ProgressBar percentage={(section.rating / 5) * 100} />
            <div className={styles.score}>
              <Star size={14} className={styles.star} />
              {section.rating}/5
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SectionRatings
