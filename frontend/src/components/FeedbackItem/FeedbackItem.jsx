import StarRating from '../StarRating/StarRating'
import styles from './FeedbackItem.module.css'

function FeedbackItem({ initials, name, rating, comment, timeAgo }) {
  return (
    <div className={styles.item}>
      <div className={styles.avatar}>{initials}</div>

      <div>
        <div className={styles.name}>
          {name}
          <StarRating rating={rating} showValue={false} />
        </div>
        <p>&ldquo;{comment}&rdquo;</p>
        <small>{timeAgo}</small>
      </div>
    </div>
  )
}

export default FeedbackItem
