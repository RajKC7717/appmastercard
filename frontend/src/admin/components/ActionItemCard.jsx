import { Calendar, Quote, Target, User } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import styles from './ActionItemCard.module.css';

const bucketLabel = {
  must: 'Must have',
  should: 'Should have',
  could: 'Could have',
  watch: 'Watch',
};

/**
 * One thing to do, and why.
 *
 * The "why" is not decoration. An action item on its own is somebody's
 * opinion; the same item with "17 volunteers said this" and two of their
 * sentences under it is something a coordinator can defend to a corporate
 * partner who asks where it came from.
 *
 * Every field below is optional-safe. Hand-written plans in
 * `adminActionPlans.js` carry prose but no evidence array; generated ones
 * carry both. The card renders whatever it is given.
 */
export default function ActionItemCard({ item }) {
  const quotes = item.evidenceQuotes ?? [];

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <Badge tone={item.bucket}>{bucketLabel[item.bucket] ?? item.bucket}</Badge>
        {item.frequency > 0 && (
          <span className={styles.frequency}>
            {item.frequency} {item.frequency === 1 ? 'volunteer' : 'volunteers'}
            {item.share != null && ` · ${item.share}% negative`}
          </span>
        )}
        {item.ratedScore != null && (
          <span className={styles.rated}>rated {item.ratedScore}/5</span>
        )}
      </div>

      <h4 className={styles.action}>{item.action}</h4>

      {item.problem && <p className={styles.problem}>{item.problem}</p>}
      {item.description && <p className={styles.description}>{item.description}</p>}

      {quotes.length > 0 && (
        <div className={styles.evidence}>
          <p className={styles.evidenceTitle}>
            <Quote size={12} aria-hidden="true" /> In their own words
          </p>
          <ul>
            {quotes.slice(0, 3).map((line) => (
              <li key={line}>&ldquo;{line}&rdquo;</li>
            ))}
          </ul>
        </div>
      )}

      {item.successMetric && (
        <p className={styles.metric}>
          <Target size={12} aria-hidden="true" /> {item.successMetric}
        </p>
      )}

      <div className={styles.meta}>
        <span>
          <User size={13} aria-hidden="true" /> {item.responsibleRole}
        </span>
        <span>
          <Calendar size={13} aria-hidden="true" /> {item.deadline}
        </span>
      </div>
    </article>
  );
}
