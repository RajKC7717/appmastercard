import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

/**
 * Stars plus the number. The stars are decorative — `aria-label` carries
 * the rating, because five icons are five icons to a screen reader.
 */
export default function StarRating({ rating, max = 5, showValue = true, size = 14 }) {
  const filled = Math.round(rating);

  return (
    <span className={styles.rating} aria-label={`${rating} out of ${max}`}>
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} size={size} className={i < filled ? styles.filled : styles.empty} />
        ))}
      </span>
      {showValue && <strong className={styles.value}>{rating}</strong>}
    </span>
  );
}
