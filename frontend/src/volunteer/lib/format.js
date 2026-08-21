/* Small pure formatters. No dependencies — Intl is built in. */

import { TODAY } from '../data/demoData.js';

const asDate = (iso) => new Date(`${iso}T00:00:00`);

/** "24 Jul 2026" — the format an Indian coordinator reads aloud. */
export function formatDate(iso) {
  return asDate(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "Fri, 24 Jul" — used on cards where the year is implied. */
export function formatShortDate(iso) {
  return asDate(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** "08:00" → "8:00 am". Volunteers read a 12-hour clock. */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Whole days between today and an event date. Negative = in the past. */
export function daysFromToday(iso) {
  const day = 86_400_000;
  return Math.round((asDate(iso) - asDate(TODAY)) / day);
}

/** "Today" · "Tomorrow" · "In 7 days" · "3 weeks ago". */
export function relativeDay(iso) {
  const diff = daysFromToday(iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return diff < 14 ? `In ${diff} days` : `In ${Math.round(diff / 7)} weeks`;
  const ago = Math.abs(diff);
  return ago < 14 ? `${ago} days ago` : `${Math.round(ago / 7)} weeks ago`;
}

/** Timestamp on a submitted feedback record. */
export function formatSubmittedAt(isoTimestamp) {
  const d = new Date(isoTimestamp);
  return `${d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}, ${d
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()}`;
}

/**
 * Human-readable reference, e.g. FB-2026-0147 or REQ-2026-0031.
 * Someone reads this aloud to a coordinator over the phone — a UUID cannot
 * be, which is why the database keeps UUIDs and the UI keeps these.
 */
export function makeReference(prefix, sequence) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

/** Mask an email for the confirmation line: r*************a@amdocs.com */
export function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (!domain || name.length < 3) return email;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name.at(-1)}@${domain}`;
}
