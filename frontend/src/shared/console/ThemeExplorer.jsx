import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tags } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { SentimentSplit } from '../ui/BarList.jsx';
import { EmptyState } from '../ui/States.jsx';
import {
  INSIGHT_THEMES,
  NEGATIVE_SENTIMENTS,
  SENTIMENT_LABEL,
  summariseThemes,
} from '../lib/insights.js';
import { timeAgo } from '../lib/date.js';
import styles from './console.module.css';
import pieces from './pieces.module.css';

/**
 * Theme discovery — problem statement C, and the half of the deep
 * challenge that a survey alone does not solve.
 *
 * The ranking is by NEGATIVE volume, not by total mentions. A theme
 * thirty people praised is reassuring; a theme fifteen people complained
 * about is a decision waiting to be made, and the Foundation opened this
 * page to find the second kind.
 *
 * Selecting a theme shows the exact fragments behind it. That is the
 * whole argument for classification being trustworthy: a label with no
 * evidence is an assertion, and no coordinator should act on one.
 *
 * Shared by the NGO admin (all partners) and the corporate SPOC (their
 * own company only) — the difference is entirely in the `feedback` passed
 * in, so neither can accidentally see the other's scope.
 */
export default function ThemeExplorer({ feedback, feedbackPath, title, caption }) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('theme') ?? '';

  const insights = useMemo(() => feedback.flatMap((row) => row.insights ?? []), [feedback]);
  const summary = useMemo(() => summariseThemes(insights), [insights]);

  const select = (theme) => {
    const next = new URLSearchParams(params);
    if (theme && theme !== selected) next.set('theme', theme);
    else next.delete('theme');
    setParams(next, { replace: true });
  };

  const active = summary.find((row) => row.theme === selected) ?? null;

  /* Every comment that produced an insight for the selected theme, so the
     evidence links back to a whole submission and not just a fragment. */
  const evidence = useMemo(() => {
    if (!active) return [];
    return feedback
      .filter((row) => (row.insights ?? []).some((insight) => insight.detectedTheme === active.theme))
      .map((row) => ({
        row,
        hits: row.insights.filter((insight) => insight.detectedTheme === active.theme),
      }))
      .sort((a, b) => {
        const aNegative = a.hits.some((hit) => NEGATIVE_SENTIMENTS.includes(hit.sentiment));
        const bNegative = b.hits.some((hit) => NEGATIVE_SENTIMENTS.includes(hit.sentiment));
        if (aNegative !== bNegative) return aNegative ? -1 : 1;
        return new Date(b.row.submittedAt) - new Date(a.row.submittedAt);
      });
  }, [active, feedback]);

  if (summary.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="No themes yet"
        message="Themes appear as soon as volunteers start leaving written comments. Ratings alone produce scores, not themes."
      />
    );
  }

  const totalNegative = summary.reduce((sum, row) => sum + row.negative, 0);
  const top = summary[0];

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="theme-list-heading">
        <div className={styles.cardHead}>
          <div>
            <h2 id="theme-list-heading" className={styles.cardTitle}>
              {title ?? 'Recurring themes'}
            </h2>
            <p className={styles.cardCaption}>
              {caption ??
                'Every written comment, broken into the aspects it mentions and how it felt about each one. Ranked by how often an aspect came up negatively.'}
            </p>
          </div>
        </div>

        <ul className={styles.stackTight}>
          {summary.map((row) => {
            const isActive = row.theme === selected;
            return (
              <li key={row.theme}>
                <button
                  type="button"
                  className={`${pieces.themeRow} ${isActive ? pieces.themeRowActive : ''}`}
                  aria-pressed={isActive}
                  onClick={() => select(row.theme)}
                >
                  <span className={pieces.themeName}>{INSIGHT_THEMES[row.theme] ?? row.theme}</span>
                  <span className={pieces.themeCount}>
                    {row.total} {row.total === 1 ? 'mention' : 'mentions'}
                  </span>
                  <SentimentSplit
                    negative={row.negative}
                    neutral={row.neutral}
                    positive={row.positive}
                  />
                  {row.negative >= 3 && row.negativeShare >= 50 && <Badge tone="urgent" />}
                </button>
              </li>
            );
          })}
        </ul>

        <p className={styles.finding}>
          {totalNegative === 0
            ? `Nothing negative has been raised yet across ${insights.length} detected aspects.`
            : `${top.negative} of the ${totalNegative} negative mentions are about ${
                INSIGHT_THEMES[top.theme]
              } — it is the single biggest source of complaint, and fixing it moves more volunteers than anything else on this list.`}
        </p>
      </section>

      {active && (
        <section className={styles.card} aria-labelledby="evidence-heading">
          <div className={styles.cardHead}>
            <div>
              <h2 id="evidence-heading" className={styles.cardTitle}>
                {INSIGHT_THEMES[active.theme]} — what volunteers actually said
              </h2>
              <p className={styles.cardCaption}>
                {active.total} mentions · {active.negative} negative · {active.positive} positive.
                Every line below is a fragment of a real submission.
              </p>
            </div>
            <Button variant="secondary" onClick={() => select('')}>
              Close
            </Button>
          </div>

          <ul className={styles.stackTight}>
            {evidence.slice(0, 12).map(({ row, hits }) => (
              <li key={row.feedbackId} className={pieces.evidenceRow}>
                <div className={pieces.evidenceHead}>
                  <strong>{row.volunteerName}</strong>
                  <span className={styles.muted}>
                    {row.eventName} · {row.companyName} · {timeAgo(row.submittedAt)}
                  </span>
                  <span className={styles.spacer} />
                  {feedbackPath && (
                    <Link to={`${feedbackPath}?q=${encodeURIComponent(row.reference)}`} className={styles.backLink}>
                      {row.reference}
                    </Link>
                  )}
                </div>
                {hits.map((hit) => (
                  <p
                    key={hit.insightId}
                    className={
                      NEGATIVE_SENTIMENTS.includes(hit.sentiment)
                        ? pieces.evidenceNegative
                        : pieces.evidenceText
                    }
                  >
                    <span className={pieces.evidenceTone}>{SENTIMENT_LABEL[hit.sentiment]}</span>
                    “{hit.evidenceText}”
                  </p>
                ))}
              </li>
            ))}
          </ul>

          {evidence.length > 12 && (
            <p className={styles.muted}>
              Showing the 12 most relevant of {evidence.length}. The rest are in Feedback,
              filtered by this theme.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
