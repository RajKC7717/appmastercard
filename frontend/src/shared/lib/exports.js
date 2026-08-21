/* ============================================================
   EXPORTS — problem statement J (admin) and M (corporate SPOC).

   "Export feedback summaries and reports into files such as Excel or PDF
    for internal review and stakeholder sharing."

   Two mechanisms, both dependency-free:

   * CSV, written with a UTF-8 BOM so Excel opens Marathi and Hindi
     comments correctly instead of turning them into mojibake. Without the
     BOM, Excel on Windows assumes the system codepage and every
     Devanagari comment in the file is destroyed — which would quietly
     ruin the one export a CSR partner actually reads.

   * PDF via the browser's own print pipeline and a print stylesheet.
     Bundling a PDF library to redraw a table we have already laid out in
     HTML costs ~250KB and produces a worse document. "Save as PDF" is in
     every print dialog on every platform.
   ============================================================ */

const BOM = '﻿';

/** RFC 4180: quote everything containing a comma, quote or newline. */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Turn rows into a CSV string.
 * `columns` is [{ key, label, value? }] — `value(row)` overrides `row[key]`.
 */
export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCell(column.value ? column.value(row) : row[column.key]))
      .join(','),
  );
  return [header, ...body].join('\r\n');
}

/** Hand the browser a file. Revoking on the next tick keeps Safari happy. */
export function downloadCsv(filename, columns, rows) {
  const blob = new Blob([BOM, toCsv(columns, rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Open the print dialog. The report page carries a print stylesheet that
 * hides the shell, so what prints is the report and nothing else.
 */
export function printReport() {
  window.print();
}

/** "Seva-Sahayog-Feedback-21-Aug-2026" — a filename someone can find later. */
export function reportFilename(prefix, date = new Date('2026-08-21T00:00:00+05:30')) {
  const stamp = date
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');
  return `${prefix.replace(/\s+/g, '-')}-${stamp}`;
}

/* ---------- Column sets, so two screens exporting "feedback" produce
   the same file ------------------------------------------------------- */

export const FEEDBACK_COLUMNS = (themeCodes, themeLabel) => [
  { key: 'reference', label: 'Reference' },
  { key: 'eventName', label: 'Activity' },
  { key: 'companyName', label: 'Corporate partner' },
  { key: 'eventDate', label: 'Activity date', value: (row) => row.eventDate?.slice(0, 10) },
  { key: 'submittedAt', label: 'Submitted at', value: (row) => row.submittedAt?.slice(0, 16).replace('T', ' ') },
  { key: 'volunteerName', label: 'Volunteer' },
  { key: 'volunteerEmail', label: 'Volunteer email' },
  { key: 'language', label: 'Language' },
  { key: 'average', label: 'Average score', value: (row) => row.average ?? '' },
  ...themeCodes.map((code) => ({
    key: code,
    label: themeLabel[code] ?? code,
    value: (row) => row.ratings?.[code] ?? '',
  })),
  { key: 'themes', label: 'Detected themes', value: (row) => (row.themes ?? []).join(' | ') },
  { key: 'overallComment', label: 'Comment (verbatim)' },
];

export const ACTIVITY_COLUMNS = [
  { key: 'eventName', label: 'Activity' },
  { key: 'companyName', label: 'Corporate partner' },
  { key: 'eventDate', label: 'Date', value: (row) => row.eventDate?.slice(0, 10) },
  { key: 'area', label: 'Area' },
  { key: 'location', label: 'Venue' },
  { key: 'activityType', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'volunteersNeeded', label: 'Volunteers needed' },
  { key: 'volunteersRegistered', label: 'Volunteers registered' },
  { key: 'responses', label: 'Feedback responses' },
  { key: 'responseRate', label: 'Response rate %' },
  { key: 'avgRating', label: 'Average score' },
  { key: 'lowCount', label: 'Low scores (1-2)' },
];

export const THEME_COLUMNS = [
  { key: 'label', label: 'Theme' },
  { key: 'total', label: 'Mentions' },
  { key: 'negative', label: 'Negative' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'positive', label: 'Positive' },
  { key: 'negativeShare', label: 'Negative share %' },
  {
    key: 'evidence',
    label: 'Example evidence',
    value: (row) => (row.evidence ?? []).map((item) => item.evidenceText).join(' | '),
  },
];
