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
