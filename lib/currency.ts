/**
 * Format amount as currency in Euros (no decimals)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format amount as currency without symbol (no decimals)
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Parse a string amount to number
 */
export function parseAmount(amountString: string): number {
  // Remove any non-digit characters except decimal point
  const cleanString = amountString.replace(/[^\d.,]/g, '');
  // Replace comma with dot for parsing
  const normalizedString = cleanString.replace(',', '.');
  return parseFloat(normalizedString) || 0;
}