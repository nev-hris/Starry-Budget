/* Date + small helpers (same as the original app.js, section 2) */

export const today = new Date();

/** Date object → "YYYY-MM-DD" (using local time, not UTC) */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const todayISO = toISODate(today);

/** "2026-11-15" → "2026-11" */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function daysInMonth(year: number, monthIndex: number): number {
  // Day 0 of next month = last day of this month
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function isFuture(isoDate: string): boolean {
  // ISO dates compare correctly as plain text
  return isoDate > todayISO;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sumBy<T>(list: T[], getValue: (item: T) => number): number {
  return list.reduce((total, item) => total + getValue(item), 0);
}

let idCounter = 0;
export function createId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
