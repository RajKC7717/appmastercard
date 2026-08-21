import { useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import Badge from '../../shared/ui/Badge.jsx';
import {
  FACES,
  GROUPS,
  LOW_RATING_THRESHOLD,
  SCALES,
  THEMES,
  themesInGroup,
} from '../data/questions.js';
import { formatShortDate, formatSubmittedAt } from '../lib/format.js';
import styles from './FeedbackRecord.module.css';

/** Groups that actually carry ratings — the comment group has none. */
const RATING_GROUPS = GROUPS.filter((group) => group.kind !== 'comment');

/** Mean of every rating given, to one decimal. */
function averageOf(ratings) {
  const values = Object.values(ratings ?? {});
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

/**
 * One submitted feedback record, collapsed to its summary until expanded.
 *
 * Expanded, it is grouped exactly as the form asked it — impact, planning,
 * communication, your role, recommendation — so a volunteer reads back what
 * they said in the same shape they said it, and the admin side reports on
 * the same five buckets.
 */
export default function FeedbackRecord({ feedback, activity }) {
  const [open, setOpen] = useState(false);

  const average = averageOf(feedback.ratings);
  const face = average ? FACES[Math.max(0, Math.round(average) - 1)] : null;
  const lowThemes = THEMES.filter(
    (theme) => (feedback.ratings?.[theme.themeCode] ?? 5) <= LOW_RATING_THRESHOLD,
  );

  return (
    <article className={styles.record}>
      <div className={styles.summary}>
        <span className={styles.face}>
          <span aria-hidden="true">{face}</span>
          <span className="srOnly">Average {average?.toFixed(1)} out of 5</span>
        </span>

        <div className={styles.summaryText}>
          <h3 className={styles.title}>{activity?.name ?? 'Activity'}</h3>
          <p className={styles.meta}>
            <CalendarDays className={styles.metaIcon} aria-hidden="true" />
            {activity ? formatShortDate(activity.date) : '—'}
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <MapPin className={styles.metaIcon} aria-hidden="true" />
            {activity?.area ?? '—'}
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <span className={styles.average}>{average?.toFixed(1)} average</span>
          </p>
        </div>

        <div className={styles.summaryEnd}>
          <span className={styles.reference}>{feedback.reference}</span>
          {lowThemes.length > 0 && (
            <Badge tone="urgent" icon={AlertTriangle}>
              {lowThemes.length} low {lowThemes.length === 1 ? 'score' : 'scores'}
            </Badge>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide what you said' : 'See what you said'}
        <ChevronDown
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className={styles.details}>
          {RATING_GROUPS.map((group) => (
            <section key={group.key} className={styles.group}>
              <h4 className={styles.groupTitle}>{group.title.EN}</h4>
              <dl className={styles.ratings}>
                {themesInGroup(group.key).map((theme) => {
                  const value = feedback.ratings?.[theme.themeCode];
                  const isLow = value != null && value <= LOW_RATING_THRESHOLD;
                  const reason = feedback.themeComments?.[theme.themeCode];
                  const labels = SCALES[theme.scale].EN;

                  return (
                    <div key={theme.themeCode} className={styles.ratingRow}>
                      <dt className={styles.ratingLabel}>{theme.themeName.EN}</dt>
                      <dd className={styles.ratingValue}>
                        <span className={styles.bar} aria-hidden="true">
                          <span
                            className={`${styles.barFill} ${isLow ? styles.barLow : ''}`}
                            style={{ width: `${((value ?? 0) / 5) * 100}%` }}
                          />
                        </span>
                        <span className={isLow ? styles.scoreLow : styles.score}>
                          {value ?? '—'}/5
                        </span>
                        <span className={styles.scoreWord}>
                          {value ? labels[value - 1] : ''}
                        </span>
                      </dd>
                      {reason && <p className={styles.reason}>“{reason}”</p>}
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          {feedback.overallComment && (
            <section className={styles.group}>
              <h4 className={styles.groupTitle}>In your words</h4>
              <p className={styles.comment}>{feedback.overallComment}</p>
            </section>
          )}

          <p className={styles.timestamp}>
            Submitted {formatSubmittedAt(feedback.submittedAt)} · {feedback.language}
          </p>
        </div>
      )}
    </article>
  );
}
