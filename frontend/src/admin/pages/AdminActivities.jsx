import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarPlus, CalendarX, Download, Trash2 } from 'lucide-react';
import Badge, { EVENT_TONE } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import DataTable, { nextSort, sortRows } from '../../shared/ui/DataTable.jsx';
import { SearchInput, SelectInput } from '../../shared/ui/Form.jsx';
import DateRangeFilter from '../../shared/ui/DateRangeFilter.jsx';
import { EmptyState, ErrorState } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import { useConsoleData } from '../../shared/console/ConsoleDataProvider.jsx';
import ActivityFormDialog from '../components/ActivityFormDialog.jsx';
import DeleteActivityDialog from '../components/DeleteActivityDialog.jsx';
import { ACTIVITY_TYPES, EVENT_STATUSES, STATUS_LABEL } from '../../shared/data/orgData.js';
import { ACTIVITY_COLUMNS, downloadCsv, reportFilename } from '../../shared/lib/exports.js';
import { formatShortDate, withinRange } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * The activity register — problem statement H: "create and maintain
 * activity records so feedback can be mapped to the correct volunteering
 * event and corporate partner."
 *
 * Register B, archetype A: counts, then filters, then a dense table.
 * Filters are on the page, not behind a button — filtering IS the feature
 * on a screen listing a month of activities, and hiding it makes the
 * screen worse at the only thing it is for.
 *
 * Every filter is a URL parameter, so a filtered view is a link a
 * coordinator can send to a colleague, and the browser Back button
 * returns to the same filter state rather than to an unfiltered list.
 */
const EMPTY_FILTERS = { q: '', status: '', company: '', type: '', from: '', to: '' };

export default function AdminActivities() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const { status, error, reload, summarised, companies, createEvent, deleteEvent } =
    useConsoleData();
  const [sort, setSort] = useState({ key: 'eventDate', direction: 'desc' });
  const [pendingDelete, setPendingDelete] = useState(null);

  const dialogOpen = params.get('new') === '1';
  const filters = { ...EMPTY_FILTERS };
  Object.keys(EMPTY_FILTERS).forEach((key) => {
    filters[key] = params.get(key) ?? '';
  });

  const setFilter = (key, value) => setFilters({ [key]: value });

  /* A patch, not a single key: moving one end of a date range past the
     other has to carry the other end with it, in one update. */
  const setFilters = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete('new');
    setParams(next, { replace: true });
  };

  const openDialog = () => {
    const next = new URLSearchParams(params);
    next.set('new', '1');
    setParams(next);
  };

  const closeDialog = () => {
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  };

  const clearFilters = () => setParams(new URLSearchParams(), { replace: true });

  const rows = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();

    return summarised.filter((event) => {
      if (filters.status && event.status !== filters.status) return false;
      if (filters.company && event.companyId !== filters.company) return false;
      if (filters.type && event.activityType !== filters.type) return false;
      if (!withinRange(event.eventDate, filters.from, filters.to)) return false;
      if (!needle) return true;
      return [event.eventName, event.companyName, event.location, event.area]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [summarised, filters.q, filters.status, filters.company, filters.type, filters.from, filters.to]);

  const columns = useMemo(
    () => [
      {
        key: 'eventName',
        label: 'Activity',
        sortable: true,
        render: (row) => row.eventName,
      },
      { key: 'companyName', label: 'Corporate partner', sortable: true },
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
        render: (row) =>
          row.avgRating == null ? (
            <span className={styles.muted}>—</span>
          ) : (
            <span className={row.needsAttention ? styles.countWarn : undefined}>
              {row.avgRating}/5
            </span>
          ),
      },
      {
        key: 'actions',
        /* Labelled, not blank. A screen reader announces every cell with
           its column header, and "column 9" is not a header. */
        label: 'Actions',
        align: 'right',
        /* Delete is offered only for a record created in this console that
           nobody has registered for. Anything with history is cancelled
           instead — the schema's RESTRICT foreign keys would refuse the
           delete, and offering a button the database rejects is worse
           than not offering one. */
        render: (row) =>
          row.createdLocally && row.volunteersRegistered === 0 ? (
            <Button variant="ghost" icon={Trash2} onClick={() => setPendingDelete(row)}>
              Delete
            </Button>
          ) : null,
      },
    ],
    [],
  );

  const sorted = sortRows(rows, columns, sort);

  const onCreate = async (payload) => {
    const result = await createEvent(payload);
    if (result.ok) {
      closeDialog();
      notify({
        message: `${result.event.eventName} created for ${result.event.companyName}.`,
        actionLabel: 'Open it',
        action: () => navigate(`/admin/activities/${result.event.eventId}`),
      });
    }
    return result;
  };

  const exportCsv = () => {
    downloadCsv(reportFilename('Seva-Sahayog-Activities'), ACTIVITY_COLUMNS, sorted);
    notify({ message: `${sorted.length} activities exported as CSV.`, tone: 'info' });
  };

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Activities</h1>
          <p className={styles.caption}>
            Every volunteering activity, and the corporate partner it belongs to. Feedback maps
            to the record you create here, which is what makes &ldquo;compare across activities
            and companies&rdquo; possible at all.
          </p>
        </div>
        <div className={styles.headActions}>
          <Button variant="secondary" icon={Download} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button icon={CalendarPlus} onClick={openDialog}>
            Create activity
          </Button>
        </div>
      </header>

      <section className={styles.filters} aria-label="Filter activities">
        <SearchInput
          value={filters.q}
          onChange={(value) => setFilter('q', value)}
          label="Search"
          placeholder="Activity, partner, venue or area"
        />

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-status">
            Status
          </label>
          <SelectInput
            id="filter-status"
            placeholder="Any status"
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            options={EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
          />
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-company">
            Corporate partner
          </label>
          <SelectInput
            id="filter-company"
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
          <label className={styles.filterLabel} htmlFor="filter-type">
            Type
          </label>
          <SelectInput
            id="filter-type"
            placeholder="Any type"
            value={filters.type}
            onChange={(event) => setFilter('type', event.target.value)}
            options={ACTIVITY_TYPES}
          />
        </div>

        <DateRangeFilter
          idPrefix="filter"
          from={filters.from}
          to={filters.to}
          onChange={setFilters}
        />
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
        caption="Activities"
        summary={`of ${summarised.length} activities shown.`}
        columns={columns}
        rows={sorted}
        loading={status === 'loading'}
        getRowKey={(row) => row.eventId}
        onRowClick={(row) => navigate(`/admin/activities/${row.eventId}`)}
        sort={sort}
        onSort={(key) => setSort((current) => nextSort(current, key))}
        empty={
          <EmptyState
            icon={CalendarX}
            title={filtered ? 'No activity matches these filters' : 'No activities yet'}
            message={
              filtered
                ? 'Widen the date range or clear a filter to see more.'
                : 'Create the first activity and assign it to a corporate partner. Volunteers see it as soon as registration opens.'
            }
            action={
              filtered ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openDialog}>Create activity</Button>
              )
            }
          />
        }
      />

      <ActivityFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={onCreate}
        companies={companies}
      />

      <DeleteActivityDialog
        open={Boolean(pendingDelete)}
        event={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          const result = await deleteEvent(pendingDelete.eventId);
          if (result.ok) {
            notify({ message: `${pendingDelete.eventName} deleted.` });
            setPendingDelete(null);
          }
          return result;
        }}
      />
    </div>
  );
}
