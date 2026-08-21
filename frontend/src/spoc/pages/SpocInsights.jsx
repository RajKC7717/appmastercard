import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { SelectInput, TextInput } from '../../shared/ui/Form.jsx';
import { ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import ThemeAverages from '../../shared/console/ThemeAverages.jsx';
import ThemeExplorer from '../../shared/console/ThemeExplorer.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { summariseThemes } from '../../shared/lib/insights.js';
import { THEME_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Feedback themes for this company — problem statement L.
 *
 * A SPOC has a specific job for this page that an NGO admin does not: they
 * have to explain to their own CSR leadership why employees should keep
 * giving up a Saturday. So the scores come first, and the themes below
 * them carry the verbatim evidence a SPOC can quote in a deck.
 */
export default function SpocInsights() {
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const { status, error, reload, feedback, summarised } = useConsoleData();

  const event = params.get('event') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const scoped = useMemo(
    () =>
      feedback.filter((row) => {
        if (event && row.eventId !== event) return false;
        return withinRange(row.submittedAt, from, to);
      }),
    [feedback, event, from, to],
  );

  const exportThemes = () => {
    const summary = summariseThemes(scoped.flatMap((row) => row.insights ?? []));
    downloadCsv(reportFilename('Volunteer-Experience-Themes'), THEME_COLUMNS, summary);
    notify({ message: `${summary.length} themes exported as CSV.`, tone: 'info' });
  };

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Feedback themes</h1>
          <p className={styles.caption}>
            What your volunteers said across every activity, grouped into themes with the exact
            words behind each one. Filter to a single activity or a date range to compare.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="secondary" icon={Download} onClick={exportThemes}>
            Export themes
          </Button>
        </div>
      </header>

      <section className={styles.filters} aria-label="Filter themes">
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="i-event">
            Activity
          </label>
          <SelectInput
            id="i-event"
            placeholder="Every activity"
            value={event}
            onChange={(changeEvent) => setFilter('event', changeEvent.target.value)}
            options={summarised
              .filter((row) => row.responses > 0)
              .map((row) => ({ value: row.eventId, label: row.eventName }))}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="i-from">
            From
          </label>
          <TextInput
            id="i-from"
            type="date"
            value={from}
            onChange={(changeEvent) => setFilter('from', changeEvent.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="i-to">
            To
          </label>
          <TextInput
            id="i-to"
            type="date"
            value={to}
            onChange={(changeEvent) => setFilter('to', changeEvent.target.value)}
          />
        </div>
      </section>

      <div className={styles.filterSummary}>
        <span>
          <span className={styles.filterCount}>{scoped.length}</span> responses in scope
        </span>
        <span>{scoped.filter((row) => row.overallComment?.trim()).length} with a comment</span>
      </div>

      {status === 'loading' ? (
        <Skeleton height={320} radius="md" />
      ) : (
        <>
          <ThemeAverages
            feedback={scoped}
            caption="The nine questions your volunteers answer after every activity, averaged."
          />
          <ThemeExplorer
            feedback={scoped}
            title="What comes up again and again"
            caption="Written comments broken into the aspects they mention. Select a theme to read the words behind it."
          />
        </>
      )}
    </div>
  );
}
