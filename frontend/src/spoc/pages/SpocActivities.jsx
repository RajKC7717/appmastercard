import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarX, Download } from 'lucide-react';
import Badge, { EVENT_TONE } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import DataTable, { nextSort, sortRows } from '../../shared/ui/DataTable.jsx';
import { SearchInput, SelectInput, TextInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import { EVENT_STATUSES, STATUS_LABEL } from '../../shared/data/orgData.js';
import { ACTIVITY_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { formatShortDate, withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Every activity run for this company — past, present and planned.
 *
 * Read-only. A SPOC coordinates the volunteers; Seva Sahayog owns the
 * activity record, because feedback maps to it and an activity edited
 * from two sides is an activity nobody can report on. Making that
 * boundary visible is better than showing a disabled button.
 */
const EMPTY = { q: '', status: '', from: '', to: '' };

export default function SpocActivities() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const { status, error, reload, summarised } = useConsoleData();
  const [sort, setSort] = useState({ key: 'eventDate', direction: 'desc' });

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
    return summarised.filter((event) => {
      if (filters.status && event.status !== filters.status) return false;
      if (!withinRange(event.eventDate, filters.from, filters.to)) return false;
      if (!needle) return true;
      return [event.eventName, event.location, event.area]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [summarised, filters.q, filters.status, filters.from, filters.to]);

  const columns = useMemo(
    () => [
      { key: 'eventName', label: 'Activity', sortable: true },
      {
        key: 'eventDate',
        label: 'Date',
        sortable: true,
        render: (row) => formatShortDate(row.eventDate),
      },
      { key: 'area', label: 'Area', sortable: true },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (row) => (
          <Badge tone={EVENT_TONE[row.status]} dot={row.status === 'ONGOING'}>
            {STATUS_LABEL[row.status]}
          </Badge>
        ),
      },
      {
        key: 'volunteersRegistered',
        label: 'Volunteers',
        align: 'right',
        sortable: true,
        render: (row) => `${row.volunteersRegistered}/${row.volunteersNeeded}`,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        align: 'right',
        sortable: true,
        render: (row) =>
          ['UPCOMING', 'REGISTRATION_OPEN', 'CANCELLED'].includes(row.status) ? (
            <span className={styles.muted}>—</span>
          ) : (
            `${row.responseRate}%`
          ),
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

  const sorted = sortRows(rows, columns, sort);

  const exportCsv = () => {
    downloadCsv(reportFilename('Volunteering-Activities'), ACTIVITY_COLUMNS, sorted);
    notify({ message: `${sorted.length} activities exported as CSV.`, tone: 'info' });
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
          <h1 className={styles.title}>Activities</h1>
          <p className={styles.caption}>
            Everything Seva Sahayog has run, or has planned, for your company. Open one to see
            who registered and what they said afterwards.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="secondary" icon={Download} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </header>

      <section className={styles.filters} aria-label="Filter activities">
        <SearchInput
          value={filters.q}
          onChange={(value) => setFilter('q', value)}
          label="Search"
          placeholder="Activity, venue or area"
        />
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="s-status">
            Status
          </label>
          <SelectInput
            id="s-status"
            placeholder="Any status"
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            options={EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="s-from">
            From
          </label>
          <TextInput
            id="s-from"
            type="date"
            value={filters.from}
            onChange={(event) => setFilter('from', event.target.value)}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="s-to">
            To
          </label>
          <TextInput
            id="s-to"
            type="date"
            value={filters.to}
            onChange={(event) => setFilter('to', event.target.value)}
          />
        </div>
      </section>

      <div className={styles.filterSummary}>
        <span>
          <span className={styles.filterCount}>{sorted.length}</span> of {summarised.length}{' '}
          activities
        </span>
        {filtered && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <DataTable
        caption="Activities run for your company"
        columns={columns}
        rows={sorted}
        loading={status === 'loading'}
        getRowKey={(row) => row.eventId}
        onRowClick={(row) => navigate(`/spoc/activities/${row.eventId}`)}
        sort={sort}
        onSort={(key) => setSort((current) => nextSort(current, key))}
        empty={
          <EmptyState
            icon={CalendarX}
            title={filtered ? 'Nothing matches these filters' : 'No activities yet'}
            message={
              filtered
                ? 'Widen the date range or clear a filter to see more.'
                : 'Seva Sahayog creates activities for your company. The first one will appear here.'
            }
            action={
              filtered && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        }
      />
    </div>
  );
}
