import BarList from '../ui/BarList.jsx';
import { themeAverages } from '../lib/analytics.js';
import styles from './console.module.css';

/**
 * Average score per theme — one chart, directly labelled, with a caption
 * that states the FINDING rather than restating the axis.
 *
 * "Timeline planning is the weakest theme at 2.4 out of 5, and three of
 * the nine sit below 3" tells someone what to do. "Average rating by
 * theme" tells them what they are already looking at.
 *
 * The rows come from the same nine mandatory themes the volunteer form is
 * built from, in the same display order, so this chart cannot drift out
 * of step with the questions that produced it.
 */
export default function ThemeAverages({ feedback, title = 'Scores by theme', caption }) {
  const stats = themeAverages(feedback);
  const answered = stats.filter((row) => row.avgRating != null);

  const weakest = [...answered].sort((a, b) => a.avgRating - b.avgRating)[0];
  const belowThree = answered.filter((row) => row.avgRating < 3);

  const finding = answered.length
    ? belowThree.length > 0
      ? `${weakest.themeName} is the weakest theme at ${weakest.avgRating} out of 5. ${
          belowThree.length === 1
            ? 'It is the only theme below 3'
            : `${belowThree.length} of the nine themes sit below 3`
        } — that is where the next change should go.`
      : `Every theme is at 3 or above, with ${weakest.themeName} lowest at ${weakest.avgRating}. Nothing here needs fixing before the next activity.`
    : 'No ratings yet, so there is nothing to compare.';

  return (
    <section className={styles.card} aria-labelledby="themes-heading">
      <div className={styles.cardHead}>
        <div>
          <h2 id="themes-heading" className={styles.cardTitle}>
            {title}
          </h2>
          <p className={styles.cardCaption}>
            {caption ??
              'The nine questions every volunteer answers, averaged across responses. Scored 1 to 5.'}
          </p>
        </div>
      </div>

      <BarList
        max={5}
        valueSuffix=" / 5"
        rows={stats.map((row) => ({
          key: row.themeCode,
          label: row.themeName,
          hint: row.count ? `${row.count} answers` : undefined,
          value: row.avgRating,
          display: row.avgRating == null ? 'No answers yet' : `${row.avgRating} / 5`,
          tone: row.avgRating == null ? 'default' : row.avgRating < 3 ? 'warn' : 'default',
        }))}
      />

      <p className={styles.finding}>{finding}</p>
    </section>
  );
}
