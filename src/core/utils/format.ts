/** Indian comma grouping: 1,00,000 — no decimals when value is a whole number. */
export function formatInr(value: number): string {
  if (value === Math.trunc(value)) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/** Quantity with at most 1 decimal place, Indian grouping. */
export function formatQty(value: number): string {
  if (value === Math.trunc(value)) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const;

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** e.g. "3rd Jan 2025" */
export function formatOrdinalDate(date: Date): string {
  return `${ordinal(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
