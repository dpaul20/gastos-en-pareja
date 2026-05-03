"use client";

import { subMonths } from "date-fns";
import { getMonthDate } from "@/lib/utils";

const MONTHS_TO_SHOW = 6;

export function getHistoryMonths(): string[] {
  const today = new Date();
  return Array.from({ length: MONTHS_TO_SHOW }, (_, i) => {
    const d = subMonths(today, i + 1);
    return getMonthDate(d);
  });
}
