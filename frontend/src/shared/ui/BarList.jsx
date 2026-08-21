import styles from './BarList.module.css';

/**
 * The one chart type in the consoles: a horizontal bar list, labelled
 * directly on each row.
 *
 * Direct labels rather than a legend, on purpose. A legend makes the eye
 * travel between a colour key and a bar and back for every row; a label
 * on the row itself does not. It is also the only chart form that
 * survives being printed in black and white, which matters because these
 * reports get emailed to CSR partners and printed.
 *
 * No chart library. Nine rows of divs cost nothing, work at any width,
 * and are readable by a screen reader as a real list of values.
 *
 * rows: [{ key, label, value, display, hint, tone }]
 */
export default function BarList({ rows, max = 5, caption, valueSuffix = '' }) {
  return (
    <div className={styles.chart}>
      <ul className={styles.list}>
        {rows.map((row) => {
          const width = row.value == null ? 0 : Math.max(2, Math.round((row.value / max) * 100));
          return (
            <li key={row.key} className={styles.row}>
              <span className={styles.label}>
                {row.label}
                {row.hint && <span className={styles.hint}>{row.hint}</span>}
              </span>
              <span className={styles.trackWrap}>
                <span className={styles.track}>
                  <span
                    className={`${styles.fill} ${styles[row.tone ?? 'default']}`}
                    style={{ width: `${width}%` }}
                  />
                </span>
                <strong className={styles.value}>
                  {row.display ?? (row.value == null ? 'No answers yet' : `${row.value}${valueSuffix}`)}
                </strong>
              </span>
            </li>
          );
        })}
      </ul>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}

/**
 * A single row split into negative / neutral / positive, for a theme's
 * sentiment mix. The counts sit beside the bar rather than inside it, so
 * a two-mention theme is still readable.
 */
export function SentimentSplit({ negative = 0, neutral = 0, positive = 0 }) {
  const total = negative + neutral + positive;
  if (!total) return <span className={styles.noData}>No mentions</span>;

  const share = (count) => `${(count / total) * 100}%`;

  return (
    <span className={styles.split} aria-label={`${negative} negative, ${neutral} neutral, ${positive} positive`}>
      <span className={styles.splitBar}>
        {negative > 0 && <span className={styles.splitNegative} style={{ width: share(negative) }} />}
        {neutral > 0 && <span className={styles.splitNeutral} style={{ width: share(neutral) }} />}
        {positive > 0 && <span className={styles.splitPositive} style={{ width: share(positive) }} />}
      </span>
      <span className={styles.splitCounts}>
        <span className={styles.negativeText}>{negative} negative</span>
        <span className={styles.positiveText}>{positive} positive</span>
      </span>
    </span>
  );
}
