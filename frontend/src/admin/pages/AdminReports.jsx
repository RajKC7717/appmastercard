import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import DataTable, { nextSort, sortRows } from '../../shared/ui/DataTable.jsx';
import BarList from '../../shared/ui/BarList.jsx';
import { SelectInput, TextInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import ThemeAverages from '../../shared/console/ThemeAverages.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { averageRating, monthlyTrend, overallResponseRate, summariseCompany } from '../../shared/lib/analytics.js';
import { summariseThemes } from '../../shared/lib/insights.js';
import {
  ACTIVITY_COLUMNS,
  FEEDBACK_COLUMNS,
  THEME_COLUMNS,
  downloadCsv,
  printReport,
  reportFilename,
} from '../../shared/lib/exports.js';
import { THEME_CODES, THEME_LABEL } from '../../shared/data/orgData.js';
import { formatDate, NOW, withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Reporting — problem statement J: "export feedback summaries and reports
 * into files such as Excel or PDF for internal review and stakeholder
 * sharing."
 *
 * Register B, archetype C: three numbers, one chart, a supporting table.
 * Not four charts. Working memory holds a handful of things, and past
 * about a dozen metrics a dashboard becomes wallpaper.
 *
 * Two export routes, both dependency-free:
 *   CSV, with a UTF-8 byte-order mark so Excel opens Marathi and Hindi
 *   comments intact instead of turning them into mojibake;
 *   PDF, through the browser's own print pipeline and a print stylesheet
 *   that hides the console furniture.
 *
 * The "as of" line is not decoration. An impact number with no date on it
 * is not a credible number, and these get emailed to CSR partners.
 */
export default function AdminReports() {
  const { notify } = useToast();
  const { status, error, reload, summarised, feedback, companies } = useConsoleData();
  const [range, setRange] = useState({ from: '2026-05-01', to: '2026-08-31', company: '' });
  const [sort, setSort] = useState({ key: 'eventDate', direction: 'desc' });

  const change = (key) => (event) =>
    setRange((current) => ({ ...current, [key]: event.target.value }));

  const events = useMemo(
    () =>
      summarised.filter((event) => {
        if (range.company && event.companyId !== range.company) return false;
        return withinRange(event.eventDate, range.from, range.to);
      }),
    [summarised, range],
  );

  const rows = useMemo(() => {
    const ids = new Set(events.map((event) => event.eventId));
    return feedback.filter((row) => ids.has(row.eventId));
  }, [events, feedback]);

  const partners = useMemo(
    () =>
      companies
        .filter((company) => !range.company || company.companyId === range.company)
        .map((company) => summariseCompany(company, events, feedback))
        .filter((company) => company.eventCount > 0),
    [companies, events, feedback, range.company],
  );

  const trend = useMemo(() => monthlyTrend(events, rows), [events, rows]);
  const themes = useMemo(() => summariseThemes(rows.flatMap((row) => row.insights ?? [])), [rows]);

  const columns = useMemo(
    () => [
      { key: 'eventName', label: 'Activity', sortable: true },
      { key: 'companyName', label: 'Partner', sortable: true },
      { key: 'eventDate', label: 'Date', sortable: true, render: (row) => formatDate(row.eventDate) },
      { key: 'volunteersRegistered', label: 'Volunteers', align: 'right', sortable: true },
      { key: 'responses', label: 'Responses', align: 'right', sortable: true },
      {
        key: 'responseRate',
        label: 'Response rate',
        align: 'right',
        sortable: true,
        render: (row) => `${row.responseRate}%`,
      },
      {
        key: 'avgRating',
        label: 'Score',
        align: 'right',
        sortable: true,
        render: (row) => (row.avgRating == null ? '—' : `${row.avgRating}/5`),
      },
    ],
    [],
  );

  const sorted = sortRows(events, columns, sort);

  const exportAs = (kind) => {
    if (kind === 'activities') {
      downloadCsv(reportFilename('Seva-Sahayog-Activity-Report'), ACTIVITY_COLUMNS, sorted);
      notify({ message: `${sorted.length} activities exported.`, tone: 'info' });
    } else if (kind === 'feedback') {
      downloadCsv(
        reportFilename('Seva-Sahayog-Feedback-Report'),
        FEEDBACK_COLUMNS(THEME_CODES, THEME_LABEL),
        rows,
      );
      notify({ message: `${rows.length} responses exported.`, tone: 'info' });
    } else {
      downloadCsv(reportFilename('Seva-Sahayog-Theme-Report'), THEME_COLUMNS, themes);
      notify({ message: `${themes.length} themes exported.`, tone: 'info' });
    }
  };

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const responseRate = overallResponseRate(events, rows);
  const score = averageRating(rows);
  const scopeLabel = range.company
    ? companies.find((company) => company.companyId === range.company)?.companyName
    : 'all corporate partners';

  return (
    <div className={styles.page}>
      {/* Only on paper: a report someone printed and put in a folder has
          to say what it covers without the screen next to it. */}
      <div className={styles.printOnly}>
        <h1 className={styles.title}>Seva Sahayog — volunteer experience report</h1>
        <p className={styles.caption}>
          {scopeLabel} · {formatDate(range.from)} to {formatDate(range.to)} · prepared{' '}
          {formatDate(NOW)}
        </p>
      </div>

      <header className={`${styles.head} ${styles.noPrint}`}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.caption}>
            A period summary for internal review or a CSR partner. Export the underlying rows as
            CSV for Excel, or print this page to PDF.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="secondary" icon={Download} onClick={() => exportAs('activities')}>
            Activities CSV
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => exportAs('feedback')}>
            Feedback CSV
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => exportAs('themes')}>
            Themes CSV
          </Button>
          <Button icon={Printer} onClick={printReport}>
            Print / save as PDF
          </Button>
        </div>
      </header>

      <section className={`${styles.filters} ${styles.noPrint}`} aria-label="Report period">
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="r-company">
            Corporate partner
          </label>
          <SelectInput
            id="r-company"
            placeholder="Every partner"
            value={range.company}
            onChange={change('company')}
            options={companies.map((row) => ({ value: row.companyId, label: row.companyName }))}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="r-from">
            From
          </label>
          <TextInput id="r-from" type="date" value={range.from} onChange={change('from')} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="r-to">
            To
          </label>
          <TextInput id="r-to" type="date" value={range.to} onChange={change('to')} />
        </div>
      </section>

      {status === 'loading' ? (
        <Skeleton height={320} radius="md" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Download}
          title="Nothing in this period"
          message="Widen the date range, or choose a different partner, to build a report."
        />
      ) : (
        <>
          <section className={styles.counts} aria-label="Period summary">
            <div className={styles.countPrimary}>
              <span className={styles.countValue}>{responseRate}%</span>
              <span className={styles.countLabel}>Response rate</span>
              <span className={styles.countHint}>
                {rows.length} responses from {events.length} activities
              </span>
            </div>
            <div className={styles.count}>
              <span className={styles.countValue}>{score ?? '—'}</span>
              <span className={styles.countLabel}>Average experience out of 5</span>
              <span className={styles.countHint}>Across all nine themes</span>
            </div>
            <div className={styles.count}>
              <span className={styles.countValue}>
                {events.reduce((sum, event) => sum + event.volunteersRegistered, 0)}
              </span>
              <span className={styles.countLabel}>Volunteers engaged</span>
              <span className={styles.countHint}>Registrations across the period</span>
            </div>
          </section>
          <p className={styles.asOf}>As of {formatDate(NOW)}.</p>

          <ThemeAverages
            feedback={rows}
            title="Experience by theme"
            caption={`Averaged across every response in this period for ${scopeLabel}.`}
          />

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Response rate by month</h2>
                <p className={styles.cardCaption}>
                  How many volunteers are telling us anything at all — the number that decides
                  whether every other number here is trustworthy.
                </p>
              </div>
            </div>
            <BarList
              max={Math.max(...trend.map((month) => month.responses), 1)}
              rows={trend.map((month) => ({
                key: month.key,
                label: month.label,
                value: month.responses,
                hint: month.avgRating ? `averaging ${month.avgRating}/5` : undefined,
                display: `${month.responses} responses`,
              }))}
            />
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>By corporate partner</h2>
                <p className={styles.cardCaption}>
                  The comparison across companies the Foundation cannot make today.
                </p>
              </div>
            </div>
            <ul className={styles.stackTight}>
              {partners.map((partner) => (
                <li key={partner.companyId} className={styles.row}>
                  <strong style={{ minWidth: 140 }}>{partner.companyName}</strong>
                  <span className={styles.muted}>
                    {partner.eventCount} activities · {partner.volunteersEngaged} volunteers ·{' '}
                    {partner.responses} responses
                  </span>
                  <span className={styles.spacer} />
                  <span className={styles.mono}>{partner.responseRate}% responded</span>
                  <span className={styles.mono}>{partner.avgRating ?? '—'}/5</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Every activity in the period</h2>
                <p className={styles.cardCaption}>
                  The rows behind the numbers above. Export as CSV to work on them in Excel.
                </p>
              </div>
            </div>
            <DataTable
              caption="Activities in the reporting period"
              columns={columns}
              rows={sorted}
              getRowKey={(row) => row.eventId}
              sort={sort}
              onSort={(key) => setSort((current) => nextSort(current, key))}
              empty={<EmptyState icon={Download} title="Nothing here" message="Widen the range." />}
            />
          </section>
        </>
      )}
    </div>
  );
}
