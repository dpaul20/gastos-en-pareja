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

export function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d
    .toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    .replaceAll(/\s+de\s+/gi, " ") // Windows adds "de" between month and year
    .replace(/^\w/, (c) => c.toUpperCase());
}
