import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatARS(amount: number): string {
  return "$" + amount.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function getMonthDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
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
