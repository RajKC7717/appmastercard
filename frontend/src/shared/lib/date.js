/* ============================================================
   Console-side date helpers.

   The volunteer app has its own formatters in volunteer/lib/format.js,
   pinned to the demo's TODAY. These are the same formats for the admin
   and SPOC consoles, but they take real ISO timestamps (the shape the
   backend returns for events.event_date and feedback.submitted_at, both
   timestamptz) rather than the volunteer app's date-only strings.
   ============================================================ */

/** The instant the demo treats as "now". Matches volunteer/data/demoData TODAY. */
export const NOW = new Date('2026-08-21T12:00:00+05:30');

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** "21 Aug 2026" — the format an Indian coordinator reads aloud. */
export function formatDate(value) {
  if (!value) return '—';
  return toDate(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "Fri, 21 Aug" — on cards and rows where the year is implied. */
export function formatShortDate(value) {
  if (!value) return '—';
  return toDate(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** "21 Aug 2026, 6:12 pm" — a submission timestamp. */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = toDate(value);
  return `${formatDate(d)}, ${d
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()}`;
}

/** "8:00 am – 11:30 am" from two "HH:MM" strings. */
export function formatTimeRange(start, end) {
  const one = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h < 12 ? 'am' : 'pm';
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
  };
  return `${one(start)} – ${one(end)}`;
}

/** Whole days from NOW. Negative = already happened. */
export function daysFromNow(value) {
  const day = 86_400_000;
  const a = toDate(value);
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((midnight(a) - midnight(NOW)) / day);
}

/** "Today" · "Tomorrow" · "In 9 days" · "3 weeks ago". */
export function relativeDay(value) {
  const diff = daysFromNow(value);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return diff < 14 ? `In ${diff} days` : `In ${Math.round(diff / 7)} weeks`;
  const ago = Math.abs(diff);
  return ago < 14 ? `${ago} days ago` : `${Math.round(ago / 7)} weeks ago`;
}

/** "2 hours ago" — used beside a feedback comment. */
export function timeAgo(value) {
  const minutes = Math.round((NOW - toDate(value)) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return `${Math.round(days / 7)} weeks ago`;
}

/** YYYY-MM-DD, for <input type="date"> and for date-range comparisons. */
export function toDateInput(value) {
  if (!value) return '';
  const d = toDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Inclusive date-range test against a YYYY-MM-DD pair. Either bound may be blank. */
export function withinRange(value, from, to) {
  const day = toDateInput(value);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}
