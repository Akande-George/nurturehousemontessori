// Format an integer amount of kobo/cents as Naira.
export function formatNaira(amountCents: number): string {
  return `₦${(amountCents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
