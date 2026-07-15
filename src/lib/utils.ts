import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatARS(amount: number): string {
  return "$" + amount.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

// R3-A: fixed timezone used to assign fixed_expense_instances.month so the
// same instant always maps to the same calendar month whether this runs
// server-side (Vercel, UTC) or client-side (browser, typically es-AR).
const MONTH_ASSIGNMENT_TIMEZONE = "America/Argentina/Buenos_Aires";
const monthDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MONTH_ASSIGNMENT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
});

/**
 * Returns "YYYY-MM-01" for the month containing `date`, computed in a single
 * fixed timezone (America/Argentina/Buenos_Aires) regardless of the runtime's
 * own local timezone. This is deliberate: reading `date.getFullYear()` /
 * `date.getMonth()` directly would depend on the process's ambient TZ, which
 * differs between server (UTC on Vercel) and client (browser, es-AR) —
 * causing the same instant to resolve to different months near a month
 * boundary. See spec: "Month Assignment Is Timezone-Deterministic".
 */
export function getMonthDate(date = new Date()): string {
  const parts = monthDateFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}-01`;
}

const fullDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MONTH_ASSIGNMENT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Returns today's full calendar date as "YYYY-MM-DD", computed in a single
 * fixed timezone (America/Argentina/Buenos_Aires) regardless of the runtime's
 * own local timezone. Same rationale as `getMonthDate`: server actions run in
 * UTC (Vercel) while the client runs in es-AR, so `new Date().toISOString()`
 * would resolve to different days near a day boundary. Use this instead of
 * `new Date().toISOString().slice(0, 10)` for user-facing default dates.
 */
export function getTodayBADate(date = new Date()): string {
  const parts = fullDateFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function getPreviousMonthDate(reference = new Date()): string {
  const prev = new Date(
    Date.UTC(reference.getFullYear(), reference.getMonth() - 1, 1),
  );
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export { getInitials } from "./utils/initials";

const SHORT_MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/**
 * Formats a plain "YYYY-MM-DD" date string as "D mmm" (e.g. "22 abr").
 * Pure string transform — no Date parsing, so it is deterministic and
 * hydration-safe regardless of the runtime timezone.
 */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-").map(Number);
  if (!month || !day || month < 1 || month > 12) return isoDate;
  return `${day} ${SHORT_MONTHS_ES[month - 1]}`;
}

export function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d
    .toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    .replaceAll(/\s+de\s+/gi, " ") // Windows adds "de" between month and year
    .replace(/^\w/, (c) => c.toUpperCase());
}
