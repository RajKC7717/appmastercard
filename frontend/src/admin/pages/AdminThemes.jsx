import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import { SelectInput, TextInput } from '../../shared/ui/Form.jsx';
import { ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import ThemeExplorer from '../../shared/console/ThemeExplorer.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { summariseThemes } from '../../shared/lib/insights.js';
import { THEME_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Themes across every partner and every activity — the Foundation-wide
 * view of "identify recurring themes", which is the second thing the
 * problem statement says it cannot do today.
 *
 * The two filters here are partner and date, because the two questions
 * asked of this page are "is this happening everywhere or just at one
 * company?" and "is it getting better since we changed something?"
 */
export default function AdminThemes() {
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const { status, error, reload, feedback, companies } = useConsoleData();

  const company = params.get('company') ?? '';
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
        if (company && row.companyId !== company) return false;
        return withinRange(row.submittedAt, from, to);
      }),
    [feedback, company, from, to],
  );

  const exportThemes = () => {
    const summary = summariseThemes(scoped.flatMap((row) => row.insights ?? []));
    downloadCsv(reportFilename('Seva-Sahayog-Themes'), THEME_COLUMNS, summary);
    notify({ message: `${summary.length} themes exported as CSV.`, tone: 'info' });
  };

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const commented = scoped.filter((row) => row.overallComment?.trim()).length;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Themes</h1>
          <p className={styles.caption}>
            Written comments, broken into the aspects they mention. Every label is drawn from a
            fixed vocabulary, so &ldquo;started late&rdquo;, &ldquo;the schedule slipped&rdquo;
            and &ldquo;we began an hour behind&rdquo; count as one theme instead of three.
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
          <label className={styles.filterLabel} htmlFor="t-company">
            Corporate partner
          </label>
          <SelectInput
            id="t-company"
            placeholder="Every partner"
            value={company}
            onChange={(event) => setFilter('company', event.target.value)}
            options={companies.map((row) => ({ value: row.companyId, label: row.companyName }))}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="t-from">
            From
          </label>
          <TextInput
            id="t-from"
            type="date"
            value={from}
            onChange={(event) => setFilter('from', event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="t-to">
            To
          </label>
          <TextInput
            id="t-to"
            type="date"
            value={to}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </div>
      </section>

      <div className={styles.filterSummary}>
        <span>
          <span className={styles.filterCount}>{commented}</span> comments analysed
          {company && ' for this partner'}
        </span>
        <span>
          {scoped.length} responses in scope · classification runs on submission, in the browser
        </span>
      </div>

      {status === 'loading' ? (
        <Skeleton height={320} radius="md" />
      ) : (
        <ThemeExplorer feedback={scoped} feedbackPath="/admin/feedback" />
      )}
    </div>
  );
}
