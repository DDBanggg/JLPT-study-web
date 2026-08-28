const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const PROGRAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  if (!date) {
    throw new Error("INVALID_DATE");
  }

  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

export function differenceInCalendarDays(laterIsoDate: string, earlierIsoDate: string): number {
  const later = parseIsoDate(laterIsoDate);
  const earlier = parseIsoDate(earlierIsoDate);
  if (!later || !earlier) {
    throw new Error("INVALID_DATE");
  }

  return Math.round((later.getTime() - earlier.getTime()) / DAY_IN_MS);
}

export function projectedDay100Date(progressStartDate: string): string {
  return addCalendarDays(progressStartDate, 99);
}

export function deriveCurrentStudyDay(progressStartDate: string, today: string): number {
  return Math.min(100, Math.max(1, differenceInCalendarDays(today, progressStartDate) + 1));
}

export function deriveDaysUntilExam(examDate: string, today: string): number {
  return Math.max(0, differenceInCalendarDays(examDate, today));
}

export function deriveProgressPercent(completedStudyDays: number): number {
  const normalized = Math.min(100, Math.max(0, Math.trunc(completedStudyDays)));
  return normalized;
}

export function currentIsoDateInTimeZone(
  timeZone = PROGRAM_TIME_ZONE,
  now = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}
