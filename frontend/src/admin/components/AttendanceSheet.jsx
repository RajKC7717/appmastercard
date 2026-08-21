import { useEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import Badge, { ATTENDANCE_TONE } from '../../shared/ui/Badge.jsx';
import Button from '../../shared/ui/Button.jsx';
import DataTable from '../../shared/ui/DataTable.jsx';
import { SearchInput } from '../../shared/ui/Form.jsx';
import { EmptyState, ErrorState } from '../../shared/ui/States.jsx';
import { useToast } from '../../shared/ui/Toast.jsx';
import { getRegistrations } from '../../shared/lib/orgApi.js';
import { formatDateTime } from '../../shared/lib/date.js';
import styles from '../../shared/console/console.module.css';

/**
 * Who registered, who turned up, and who has given feedback — one sheet.
 *
 * Marking attendance is optimistic with an undo toast rather than a
 * confirmation dialog. Someone marking sixty people present should not be
 * asked "are you sure?" sixty times; the undo costs nothing when they were
 * right and saves the row when they were not.
 *
 * The feedback column is the honest answer to "who have we not heard
 * from?" — the question the response-rate percentage above only summarises.
 */
export default function AttendanceSheet({ event, feedback }) {
  const { notify } = useToast();
  const [state, setState] = useState({ status: 'loading', rows: [], error: null });
  const [query, setQuery] = useState('');

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', rows: [], error: null });

    getRegistrations(event.eventId, feedback)
      .then(({ data }) => live && setState({ status: 'loaded', rows: data, error: null }))
      .catch((error) => live && setState({ status: 'error', rows: [], error: error.message }));

    return () => {
      live = false;
    };
  }, [event.eventId, feedback]);

  const mark = (row, attendanceStatus) => {
    const previous = row.attendanceStatus;

    setState((current) => ({
      ...current,
      rows: current.rows.map((candidate) =>
        candidate.registrationId === row.registrationId
          ? { ...candidate, attendanceStatus }
          : candidate,
      ),
    }));

    notify({
      message: `${row.volunteerName} marked ${attendanceStatus === 'ATTENDED' ? 'present' : 'absent'}.`,
      action: () =>
        setState((current) => ({
          ...current,
          rows: current.rows.map((candidate) =>
            candidate.registrationId === row.registrationId
              ? { ...candidate, attendanceStatus: previous }
              : candidate,
          ),
        })),
    });
  };

  const needle = query.trim().toLowerCase();
  const rows = state.rows.filter((row) =>
    needle ? `${row.volunteerName} ${row.area} ${row.volunteerEmail}`.toLowerCase().includes(needle) : true,
  );

  const marked = state.rows.filter((row) => row.attendanceStatus !== 'REGISTERED').length;

  const columns = [
    { key: 'volunteerName', label: 'Volunteer' },
    { key: 'area', label: 'Area' },
    { key: 'volunteerPhone', label: 'Mobile' },
    {
      key: 'attendanceStatus',
      label: 'Attendance',
      render: (row) => (
        <Badge tone={ATTENDANCE_TONE[row.attendanceStatus]}>
          {row.attendanceStatus === 'REGISTERED' ? 'Not marked' : undefined}
        </Badge>
      ),
    },
    {
      key: 'feedbackReference',
      label: 'Feedback',
      render: (row) =>
        row.feedbackReference ? (
          <span title={formatDateTime(row.feedbackSubmittedAt)}>{row.feedbackReference}</span>
        ) : (
          <span className={styles.muted}>Not given</span>
        ),
    },
    {
      key: 'actions',
      label: 'Mark',
      align: 'right',
      render: (row) => (
        <span className={styles.row}>
          <Button
            variant={row.attendanceStatus === 'ATTENDED' ? 'primary' : 'secondary'}
            onClick={() => mark(row, 'ATTENDED')}
          >
            Present
          </Button>
          <Button
            variant={row.attendanceStatus === 'ABSENT' ? 'danger' : 'ghost'}
            onClick={() => mark(row, 'ABSENT')}
          >
            Absent
          </Button>
        </span>
      ),
    },
  ];

  if (state.status === 'error') {
    return <ErrorState message={state.error} />;
  }

  return (
    <section className={styles.card} aria-labelledby="attendance-heading">
      <div className={styles.cardHead}>
        <div>
          <h2 id="attendance-heading" className={styles.cardTitle}>
            Attendance sheet
          </h2>
          <p className={styles.cardCaption}>
            {state.status === 'loading'
              ? 'Loading the register…'
              : `${marked} of ${state.rows.length} marked. Anyone who submitted feedback is present by definition.`}
          </p>
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Find a volunteer"
          placeholder="Name, area or email"
        />
      </div>

      <DataTable
        caption={`Attendance for ${event.eventName}`}
        columns={columns}
        rows={rows}
        loading={state.status === 'loading'}
        getRowKey={(row) => row.registrationId}
        empty={
          <EmptyState
            icon={UserX}
            title={needle ? 'Nobody by that name' : 'No registrations yet'}
            message={
              needle
                ? 'Check the spelling, or clear the search to see the whole register.'
                : 'Volunteers appear here as they register through the portal.'
            }
          />
        }
      />
    </section>
  );
}
