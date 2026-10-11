/**
 * format.js
 * ---------
 * Small helpers for turning raw API values into text people can read.
 *
 * OpenUV returns every time in UTC (e.g. "2026-10-11T07:12:00.000Z").
 * We convert those into the local time of the place being searched,
 * using the built-in Intl API - no extra packages needed.
 */

/**
 * Check that a timezone name (e.g. "Asia/Karachi") is valid.
 * Falls back to UTC if it is missing or unknown, so formatting never crashes.
 * @param {string} timeZone
 * @returns {string}
 */
export function safeTimeZone(timeZone) {
  try {
    // Throws a RangeError for an unknown timezone.
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format an ISO date string as a local clock time, e.g. "13:05".
 * Returns "—" when the value is missing or not a real date.
 * @param {string} iso
 * @param {string} timeZone
 */
export function formatTime(iso, timeZone) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

/**
 * Format a date as a long local date and time, e.g. "Sunday 11 October, 10:45".
 * @param {Date|string} value
 * @param {string} timeZone
 */
export function formatDateTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

/**
 * Turn a number of minutes into friendly text, e.g. 95 -> "1 h 35 min".
 * @param {number} minutes
 */
export function formatDuration(minutes) {
  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

/**
 * Round a UV value to one decimal place for display (e.g. 5.63 -> "5.6").
 * @param {number} uv
 */
export function formatUv(uv) {
  const value = Number(uv);
  return Number.isFinite(value) ? value.toFixed(1) : '—';
}
