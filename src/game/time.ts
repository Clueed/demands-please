/** The working day, in minutes since midnight. */
export const DAY_START = 9 * 60;
export const DAY_END = 17 * 60;
/** Real time per game minute: an hour lasts 24 seconds, the whole day just over three minutes. */
export const MS_PER_GAME_MINUTE = 400;

export const LAST_DAY = 10;
/** Requests per day. About an hour each, with an hour of slack in the day. */
export const DEMANDS_PER_DAY = 7;
/** Audit findings that end the run: the steering committee takes over approvals. */
export const FINDINGS_LIMIT = 3;

/** Day 1 is Monday 2 November 2026; weekends are skipped. */
const FIRST_DAY = Date.UTC(2026, 10, 2);
const DAY_MS = 24 * 60 * 60 * 1000;

/** The date of a game day, as an ISO date like "2026-11-02". */
export function dayDate(day: number): string {
  const weeks = Math.floor((day - 1) / 5);
  const weekday = (day - 1) % 5;
  return new Date(FIRST_DAY + (weeks * 7 + weekday) * DAY_MS).toISOString().slice(0, 10);
}

/** Shift an ISO date by a number of days. */
export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "13 Nov 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Fri 13 Nov 2026". The year matters: certificates are checked against today. */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getUTCDay()]} ${formatDate(iso)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes since midnight as a 24-hour clock time, e.g. "09:30". */
export function clock(minutes: number): string {
  const m = Math.floor(minutes);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
