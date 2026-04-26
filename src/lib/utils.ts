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

export function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d
    .toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}
