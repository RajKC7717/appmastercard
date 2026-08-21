import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, MessageSquareX } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { SearchInput, SelectInput, TextInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import FeedbackCard from '../../shared/console/FeedbackCard.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { INSIGHT_THEMES } from '../../shared/lib/insights.js';
import { THEME_CODES, THEME_LABEL } from '../../shared/data/orgData.js';
import { FEEDBACK_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * The centralised feedback record — problem statement I, in full:
 * "view feedback filtered by activity, date, corporate partner, rating,
 *  and common improvement themes."
 *
 * All five filters are here, on the page, together with a text search
 * over the comments themselves, which is the sixth thing anyone actually
 * wants: "did anyone else mention the bus?"
 *
 * This screen is the direct answer to the stated problem. Everything the
 * Foundation currently loses to WhatsApp and phone calls is one row here,
 * retrievable months later, in the volunteer's own words.
 */
const RATING_BANDS = [
  { value: 'low', label: '1 – 2 (needs action)' },
  { value: 'mid', label: '3 (mixed)' },
  { value: 'high', label: '4 – 5 (positive)' },
];

const bandFor = (average) => {
  if (average == null) return null;
  if (average <= 2.5) return 'low';
  if (average < 3.5) return 'mid';
  return 'high';
};

const EMPTY = { q: '', event: '', company: '', theme: '', band: '', from: '', to: '' };

export default function AdminFeedback() {
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const { status, error, reload, feedback, summarised, companies } = useConsoleData();

  const filters = { ...EMPTY };
  Object.keys(EMPTY).forEach((key) => {
    filters[key] = params.get(key) ?? '';
  });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });
  const filtered = Object.values(filters).some(Boolean);

  const rows = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();

    return feedback.filter((row) => {
      if (filters.event && row.eventId !== filters.event) return false;
      if (filters.company && row.companyId !== filters.company) return false;
      if (filters.theme && !row.themes.includes(filters.theme)) return false;
      if (filters.band && bandFor(row.average) !== filters.band) return false;
      if (!withinRange(row.submittedAt, filters.from, filters.to)) return false;
      if (!needle) return true;
      /* Searching the comment text is the point — this is the thing that
         cannot be done at all when feedback lives in a WhatsApp thread. */
      return [row.overallComment, row.themeCommentText, row.volunteerName, row.eventName]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [feedback, filters.q, filters.event, filters.company, filters.theme, filters.band, filters.from, filters.to]);

  const themeOptions = useMemo(() => {
    const seen = new Set(feedback.flatMap((row) => row.themes));
    return [...seen]
      .map((theme) => ({ value: theme, label: INSIGHT_THEMES[theme] ?? theme }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [feedback]);

  const exportCsv = () => {
    downloadCsv(
      reportFilename('Seva-Sahayog-Feedback'),
      FEEDBACK_COLUMNS(THEME_CODES, THEME_LABEL),
      rows,
    );
    notify({ message: `${rows.length} responses exported as CSV.`, tone: 'info' });
  };

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const withComments = rows.filter((row) => row.overallComment?.trim()).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Feedback</h1>
          <p className={styles.caption}>
            Every response ever submitted, in the volunteer&rsquo;s own words. Filter by
            activity, partner, date, score or detected theme — or search the comments
            themselves.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="secondary" icon={Download} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </header>

      <section className={styles.filters} aria-label="Filter feedback">
        <SearchInput
          value={filters.q}
          onChange={(value) => setFilter('q', value)}
          label="Search comments"
          placeholder="bus, gloves, briefing, a volunteer's name…"
        />

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-event">
            Activity
          </label>
          <SelectInput
            id="f-event"
            placeholder="Every activity"
            value={filters.event}
            onChange={(event) => setFilter('event', event.target.value)}
            options={summarised
              .filter((event) => event.responses > 0)
              .map((event) => ({ value: event.eventId, label: event.eventName }))}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-company">
            Corporate partner
          </label>
          <SelectInput
            id="f-company"
            placeholder="Every partner"
            value={filters.company}
            onChange={(event) => setFilter('company', event.target.value)}
            options={companies.map((company) => ({
              value: company.companyId,
              label: company.companyName,
            }))}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-theme">
            Improvement theme
          </label>
          <SelectInput
            id="f-theme"
            placeholder="Any theme"
            value={filters.theme}
            onChange={(event) => setFilter('theme', event.target.value)}
            options={themeOptions}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-band">
            Score
          </label>
          <SelectInput
            id="f-band"
            placeholder="Any score"
            value={filters.band}
            onChange={(event) => setFilter('band', event.target.value)}
            options={RATING_BANDS}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-from">
            Submitted from
          </label>
          <TextInput
            id="f-from"
            type="date"
            value={filters.from}
            onChange={(event) => setFilter('from', event.target.value)}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="f-to">
            Submitted to
          </label>
          <TextInput
            id="f-to"
            type="date"
            value={filters.to}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </div>
      </section>

      <div className={styles.filterSummary}>
        <span>
          <span className={styles.filterCount}>{rows.length}</span> of {feedback.length} responses
        </span>
        <span>{withComments} with a written comment</span>
        {filtered && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {status === 'loading' ? (
        <div className={styles.stack}>
          <Skeleton height={180} radius="md" />
          <Skeleton height={180} radius="md" />
          <Skeleton height={180} radius="md" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MessageSquareX}
          title={filtered ? 'Nothing matches these filters' : 'No feedback yet'}
          message={
            filtered
              ? 'Try a broader date range, or clear one filter at a time to see what narrows it.'
              : 'Feedback lands here the moment a volunteer submits it, mapped to the activity they attended.'
          }
          action={
            filtered && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.stack}>
          {rows.map((row) => (
            <FeedbackCard
              key={row.feedbackId}
              feedback={row}
              to={`/admin/activities/${row.eventId}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
