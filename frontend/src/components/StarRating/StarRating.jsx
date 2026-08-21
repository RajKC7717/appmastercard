import { Star } from 'lucide-react'
import styles from './StarRating.module.css'

function StarRating({ rating, max = 5, showValue = true }) {
  const filledCount = Math.round(rating)

  return (
    <span className={styles.rating}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={14} className={i < filledCount ? styles.filled : styles.empty} />
      ))}
      {showValue && <strong>{rating}</strong>}
    </span>
  )
}

export default StarRating
