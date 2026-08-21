import { Link } from 'react-router-dom';
import { Languages, Quote } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import StarRating from '../ui/StarRating.jsx';
import { INSIGHT_THEMES, NEGATIVE_SENTIMENTS, SENTIMENT_LABEL } from '../lib/insights.js';
import { LOW_RATING } from '../lib/analytics.js';
import { THEME_LABEL } from '../data/orgData.js';
import { timeAgo } from '../lib/date.js';
import styles from './pieces.module.css';

const LANGUAGE_NAME = { EN: 'English', HI: 'हिंदी', MR: 'मराठी' };

/**
 * One volunteer's submission, as a staff member reads it.
 *
 * Three things are shown, in this order, because that is the order a
 * coordinator needs them:
 *
 *  1. the score, so they can triage without reading;
 *  2. the comment VERBATIM — never translated, never trimmed, never
 *     summarised. RULE 20 in the schema says the original text is not
 *     modified, and this is the screen where that promise is visible;
 *  3. what the classifier made of it, WITH the fragment it based each
 *     label on. A theme chip with no evidence behind it is an opinion; a
 *     chip that shows the words it came from is something the admin can
 *     check and argue with.
 */
export default function FeedbackCard({ feedback, showEvent = true, to }) {
  const lowScores = Object.entries(feedback.ratings ?? {}).filter(
    ([, value]) => value <= LOW_RATING,
  );

  return (
    <article className={styles.feedback}>
      <header className={styles.feedbackHead}>
        <span className={styles.avatar} aria-hidden="true">
          {feedback.volunteerInitials}
        </span>

        <div className={styles.feedbackWho}>
          <p className={styles.feedbackName}>{feedback.volunteerName}</p>
          <p className={styles.feedbackMeta}>
            {showEvent ? (
              to ? (
                <Link to={to} className={styles.feedbackLink}>
                  {feedback.eventName}
                </Link>
              ) : (
                feedback.eventName
              )
            ) : (
              feedback.companyName
            )}
            {' · '}
            {timeAgo(feedback.submittedAt)}
          </p>
        </div>

        <div className={styles.feedbackScore}>
          <StarRating rating={feedback.average ?? 0} />
          <span className={styles.reference}>{feedback.reference}</span>
        </div>
      </header>

      <div className={styles.feedbackBadges}>
        {feedback.language !== 'EN' && (
          <Badge tone="upcoming" icon={Languages}>
            {LANGUAGE_NAME[feedback.language]}
          </Badge>
        )}
        {feedback.source === 'LIVE' && <Badge tone="live">Submitted in this session</Badge>}
        {lowScores.length > 0 && (
          <Badge tone="urgent">
            {lowScores.length} low {lowScores.length === 1 ? 'score' : 'scores'}
          </Badge>
        )}
      </div>

      {feedback.overallComment ? (
        <blockquote className={styles.quote}>
          <Quote className={styles.quoteMark} aria-hidden="true" />
          <p lang={feedback.language.toLowerCase()}>{feedback.overallComment}</p>
        </blockquote>
      ) : (
        <p className={styles.noComment}>Ratings only — this volunteer did not leave a comment.</p>
      )}

      {lowScores.length > 0 && (
        <dl className={styles.lowList}>
          {lowScores.map(([themeCode, value]) => (
            <div key={themeCode} className={styles.lowRow}>
              <dt className={styles.lowTheme}>
                {THEME_LABEL[themeCode] ?? themeCode}
                <span className={styles.lowValue}>{value}/5</span>
              </dt>
              {feedback.themeComments?.[themeCode] && (
                <dd className={styles.lowReason}>“{feedback.themeComments[themeCode]}”</dd>
              )}
            </div>
          ))}
        </dl>
      )}

      {feedback.insights?.length > 0 && (
        <div className={styles.insights}>
          <p className={styles.insightsTitle}>Detected themes</p>
          <ul className={styles.chips}>
            {feedback.insights.map((insight) => (
              <li
                key={insight.insightId}
                className={`${styles.chip} ${
                  NEGATIVE_SENTIMENTS.includes(insight.sentiment) ? styles.chipNegative : ''
                }`}
                title={`${SENTIMENT_LABEL[insight.sentiment]} · confidence ${insight.confidence}`}
              >
                <span className={styles.chipTheme}>{INSIGHT_THEMES[insight.detectedTheme]}</span>
                <span className={styles.chipSentiment}>{SENTIMENT_LABEL[insight.sentiment]}</span>
                <span className={styles.chipEvidence}>“{insight.evidenceText}”</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
