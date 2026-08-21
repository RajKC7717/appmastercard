import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Tags } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
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
 * challenge a survey alone does not solve.
 *
 * The ranking is by NEGATIVE volume, not by total mentions. A theme
 * thirty people praised is reassuring; a theme fifteen people complained
 * about is a decision waiting to be made, and the Foundation opened this
 * page to find the second kind.
 *
 * EACH THEME IS A DISCLOSURE, NOT A DIALOG. Opening one expands the
 * evidence underneath it, in place, and clicking the same row again
 * collapses it. There is deliberately no Close button: a Close implies
 * something opened over the top of the list and has to be dismissed
 * before you can carry on, which is not what happened. Collapsing back
 * into the row you opened keeps your place in a list you were scanning.
 *
 * The open theme lives in the URL, so a link to a specific theme opens on
 * that theme, and the browser Back button collapses it rather than
 * leaving the page.
 *
 * Shared by the NGO admin (all partners) and the corporate SPOC (their
 * own company only) — the difference is entirely in the `feedback` passed
 * in, so neither can accidentally see the other's scope.
 */
export default function ThemeExplorer({ feedback, feedbackPath, title, caption }) {
  const [params, setParams] = useSearchParams();
  const open = params.get('theme') ?? '';

  const insights = useMemo(() => feedback.flatMap((row) => row.insights ?? []), [feedback]);
  const summary = useMemo(() => summariseThemes(insights), [insights]);

  const toggle = (theme) => {
    const next = new URLSearchParams(params);
    if (theme === open) next.delete('theme');
    else next.set('theme', theme);
    setParams(next, { replace: true });
  };

  /* Every submission that produced an insight for a theme, so the
     evidence links back to a whole response and not just a fragment. */
  const evidenceFor = useMemo(() => {
    const byTheme = new Map();
    feedback.forEach((row) => {
      (row.insights ?? []).forEach((insight) => {
        const bucket = byTheme.get(insight.detectedTheme) ?? new Map();
        const entry = bucket.get(row.feedbackId) ?? { row, hits: [] };
        entry.hits.push(insight);
        bucket.set(row.feedbackId, entry);
        byTheme.set(insight.detectedTheme, bucket);
      });
    });

    return (theme) =>
      [...(byTheme.get(theme)?.values() ?? [])].sort((a, b) => {
        const aNegative = a.hits.some((hit) => NEGATIVE_SENTIMENTS.includes(hit.sentiment));
        const bNegative = b.hits.some((hit) => NEGATIVE_SENTIMENTS.includes(hit.sentiment));
        if (aNegative !== bNegative) return aNegative ? -1 : 1;
        return new Date(b.row.submittedAt) - new Date(a.row.submittedAt);
      });
  }, [feedback]);

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
    <section className={styles.card} aria-labelledby="theme-list-heading">
      <div className={styles.cardHead}>
        <div>
          <h2 id="theme-list-heading" className={styles.cardTitle}>
            {title ?? 'Recurring themes'}
          </h2>
          <p className={styles.cardCaption}>
            {caption ??
              'Every written comment, broken into the aspects it mentions and how it felt about each one. Ranked by how often an aspect came up negatively — open one to read the words behind it.'}
          </p>
        </div>
      </div>

      <ul className={styles.stackTight}>
        {summary.map((row) => {
          const expanded = row.theme === open;
          const panelId = `theme-panel-${row.theme}`;
          const evidence = expanded ? evidenceFor(row.theme) : [];

          return (
            <li key={row.theme} className={pieces.themeItem}>
              <button
                type="button"
                className={`${pieces.themeRow} ${expanded ? pieces.themeRowActive : ''}`}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(row.theme)}
              >
                <ChevronDown
                  className={`${pieces.themeChevron} ${expanded ? pieces.themeChevronOpen : ''}`}
                  aria-hidden="true"
                />
                <span className={pieces.themeName}>
                  {INSIGHT_THEMES[row.theme] ?? row.theme}
                </span>
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

              {expanded && (
                <div id={panelId} className={pieces.themePanel}>
                  <p className={pieces.themePanelHead}>
                    {row.negative} negative · {row.neutral} neutral · {row.positive} positive.
                    Every line below is a fragment of a real submission.
                  </p>

                  <ul className={styles.stackTight}>
                    {evidence.slice(0, 12).map(({ row: record, hits }) => (
                      <li key={record.feedbackId} className={pieces.evidenceRow}>
                        <div className={pieces.evidenceHead}>
                          <strong>{record.volunteerName}</strong>
                          <span className={styles.muted}>
                            {record.eventName} · {record.companyName} ·{' '}
                            {timeAgo(record.submittedAt)}
                          </span>
                          <span className={styles.spacer} />
                          {feedbackPath && (
                            <Link
                              to={`${feedbackPath}?q=${encodeURIComponent(record.reference)}`}
                              className={styles.backLink}
                            >
                              {record.reference}
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
                            <span className={pieces.evidenceTone}>
                              {SENTIMENT_LABEL[hit.sentiment]}
                            </span>
                            &ldquo;{hit.evidenceText}&rdquo;
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>

                  {evidence.length > 12 && (
                    <p className={styles.muted}>
                      Showing the 12 most relevant of {evidence.length}. The rest are in
                      Feedback, filtered by this theme.
                    </p>
                  )}
                </div>
              )}
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
  );
}
