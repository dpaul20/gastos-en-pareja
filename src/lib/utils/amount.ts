/**
 * Formats what the user is typing into an amount field: dots for thousands,
 * comma for decimals (es-AR). Designed to run on EVERY keystroke, so it must
 * never destroy an in-progress edit — a trailing comma survives, because
 * stripping it would make a decimal impossible to type.
 *
 * Output always round-trips through `parseAmount`. Keep the two in sync: a
 * grouping character this emits that `parseAmount` does not strip would turn
 * the displayed amount into NaN on submit.
 */
export function formatAmountInput(raw: string): string {
  // A LEADING minus is preserved on purpose. Dropping it would turn "-100"
  // into a perfectly valid "100" and save it — silently banking a number the
  // user never typed. Kept, it stays invalid and the form's own
  // `positiveMoneyString` rejects it out loud. A minus anywhere else is a
  // typo and gets dropped like any other stray character.
  const trimmed = raw.trimStart();
  const sign = trimmed.startsWith("-") ? "-" : "";
  const cleaned = trimmed.replace(/[^\d,]/g, "");
  if (!cleaned) return sign;

  // Only the first comma is a decimal separator; later ones are typos and
  // their digits fold into the decimals ("3640,5,9" -> "3.640,59").
  const [head, ...rest] = cleaned.split(",");
  const hasDecimalSeparator = rest.length > 0;
  const decimals = rest.join("").slice(0, 2);

  const integer = head.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (!hasDecimalSeparator) return `${sign}${integer}`;
  return `${sign}${integer},${decimals}`;
}

/**
 * Turns a persisted amount into the string an amount field should display.
 *
 * Supabase returns `numeric` columns as dot-decimal STRINGS ("3640000.00").
 * Handing that straight to `formatAmountInput` would read the dot as a
 * thousands separator and render "36.400.005", so the decimal is normalised to
 * a comma first. Trailing zero cents are dropped — "3.640.000,00" is noise in
 * an input the user is about to edit.
 */
export function formatStoredAmount(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return formatAmountInput(String(numeric).replace(".", ","));
}

export function parseAmount(raw: string): number {
  const s = raw.replace(/[$\s]/g, "");
  if (!s) return NaN;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  let normalized: string;

  if (hasComma && hasDot) {
    normalized = s.replaceAll(".", "").replace(",", ".");
  } else if (hasComma) {
    normalized = s.replace(",", ".");
  } else if (hasDot) {
    const afterLastDot = s.slice(s.lastIndexOf(".") + 1);
    normalized = afterLastDot.length >= 3 ? s.replaceAll(".", "") : s;
  } else {
    normalized = s;
  }

  const result = Number(normalized);
  return Number.isFinite(result) ? result : NaN;
}
