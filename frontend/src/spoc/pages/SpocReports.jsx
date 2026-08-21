import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import Button from '../../shared/ui/Button.jsx';
import BarList from '../../shared/ui/BarList.jsx';
import DataTable, { nextSort, sortRows } from '../../shared/ui/DataTable.jsx';
import { TextInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import ThemeAverages from '../../shared/console/ThemeAverages.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { averageRating, monthlyTrend, overallResponseRate } from '../../shared/lib/analytics.js';
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
 * The CSR report — problem statement M: "view and extract reports of the
 * activities conducted showcasing volunteer-experience outcomes."
 *
 * This is the document a SPOC takes to their leadership, so it is built
 * to be printed: three numbers, the experience scores, the volume of
 * participation, and the activity list behind them. The print stylesheet
 * drops the console furniture, and "Save as PDF" in the browser's print
 * dialog produces the file.
 *
 * The "as of" date is on the page for a reason — an outcome number with
 * no date on it is not a number anyone should put in a board deck.
 */
export default function SpocReports() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { status, error, reload, summarised, feedback } = useConsoleData();
  const [range, setRange] = useState({ from: '2026-05-01', to: '2026-08-31' });
  const [sort, setSort] = useState({ key: 'eventDate', direction: 'desc' });

  const change = (key) => (event) =>
    setRange((current) => ({ ...current, [key]: event.target.value }));

  const events = useMemo(
    () => summarised.filter((event) => withinRange(event.eventDate, range.from, range.to)),
    [summarised, range],
  );

  const rows = useMemo(() => {
    const ids = new Set(events.map((event) => event.eventId));
    return feedback.filter((row) => ids.has(row.eventId));
  }, [events, feedback]);

  const trend = useMemo(() => monthlyTrend(events, rows), [events, rows]);

  const columns = useMemo(
    () => [
      { key: 'eventName', label: 'Activity', sortable: true },
      { key: 'eventDate', label: 'Date', sortable: true, render: (row) => formatDate(row.eventDate) },
      { key: 'area', label: 'Area', sortable: true },
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
      downloadCsv(reportFilename(`${user?.companyName}-Activities`), ACTIVITY_COLUMNS, sorted);
      notify({ message: `${sorted.length} activities exported.`, tone: 'info' });
    } else if (kind === 'feedback') {
      downloadCsv(
        reportFilename(`${user?.companyName}-Feedback`),
        FEEDBACK_COLUMNS(THEME_CODES, THEME_LABEL),
        rows,
      );
      notify({ message: `${rows.length} responses exported.`, tone: 'info' });
    } else {
      const summary = summariseThemes(rows.flatMap((row) => row.insights ?? []));
      downloadCsv(reportFilename(`${user?.companyName}-Themes`), THEME_COLUMNS, summary);
      notify({ message: `${summary.length} themes exported.`, tone: 'info' });
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
  const participations = events.reduce((sum, event) => sum + event.volunteersRegistered, 0);

  return (
    <div className={styles.page}>
      <div className={styles.printOnly}>
        <h1 className={styles.title}>{user?.companyName} — volunteer experience report</h1>
        <p className={styles.caption}>
          Prepared with Seva Sahayog Foundation · {formatDate(range.from)} to{' '}
          {formatDate(range.to)} · {formatDate(NOW)}
        </p>
      </div>

      <header className={`${styles.head} ${styles.noPrint}`}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.caption}>
            Volunteer-experience outcomes for {user?.companyName}, ready to print or hand to your
            CSR leadership. Export the rows as CSV for Excel.
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
          <label className={styles.filterLabel} htmlFor="sr-from">
            From
          </label>
          <TextInput id="sr-from" type="date" value={range.from} onChange={change('from')} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="sr-to">
            To
          </label>
          <TextInput id="sr-to" type="date" value={range.to} onChange={change('to')} />
        </div>
      </section>

      {status === 'loading' ? (
        <Skeleton height={320} radius="md" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Download}
          title="Nothing in this period"
          message="Widen the date range to build a report."
        />
      ) : (
        <>
          <section className={styles.counts} aria-label="Period summary">
            <div className={styles.countPrimary}>
              <span className={styles.countValue}>{participations}</span>
              <span className={styles.countLabel}>Volunteer participations</span>
              <span className={styles.countHint}>
                Across {events.length} activities with Seva Sahayog
              </span>
            </div>
            <div className={styles.count}>
              <span className={styles.countValue}>{score ?? '—'}</span>
              <span className={styles.countLabel}>Average experience out of 5</span>
              <span className={styles.countHint}>As rated by your own employees</span>
            </div>
            <div className={styles.count}>
              <span className={styles.countValue}>{responseRate}%</span>
              <span className={styles.countLabel}>Response rate</span>
              <span className={styles.countHint}>
                {rows.length} responses — how much of the picture this report covers
              </span>
            </div>
          </section>
          <p className={styles.asOf}>As of {formatDate(NOW)}.</p>

          <ThemeAverages
            feedback={rows}
            title="Experience by theme"
            caption={`Every response from ${user?.companyName} volunteers in this period, averaged.`}
          />

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Participation by month</h2>
                <p className={styles.cardCaption}>
                  How many of your employees are volunteering, and telling us how it went.
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

          <section>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Activities in the period</h2>
                <p className={styles.cardCaption}>The rows behind every number above.</p>
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
