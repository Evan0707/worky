/**
 * Formats a Date object into a short localized date string.
 * @param date - The date to format
 * @param locale - BCP 47 language tag (e.g. 'fr-FR', 'en-GB')
 * @returns Formatted date string (e.g. 14/03/2026 for fr-FR)
 */
export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formats an amount in cents into a localized currency string.
 * @param cents - Amount in cents (integer)
 * @param currency - ISO 4217 Currency code (e.g. 'EUR', 'GBP')
 * @param locale - BCP 47 language tag (e.g. 'fr-FR', 'en-GB')
 * @returns Formatted currency string
 */
export function formatCurrency(
  cents: number | null | undefined,
  currency: string,
  locale: string
): string {
  if (cents === null || cents === undefined) return "0,00 €"; // fallback
  
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
