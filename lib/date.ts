import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

/**
 * Format date for API (ISO string)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return format(now, 'yyyy-MM');
}

/**
 * Get month display string
 */
export function getMonthDisplay(date: Date): string {
  // Validate date before formatting
  if (!date || isNaN(date.getTime())) {
    return 'Mois invalide';
  }
  return format(date, 'MMMM yyyy', { locale: fr });
}

/**
 * Get start and end of month
 */
export function getMonthBounds(date: Date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
}

/**
 * Check if date is in current month
 */
export function isInCurrentMonth(date: Date): boolean {
  const now = new Date();
  const { start, end } = getMonthBounds(now);
  return isWithinInterval(date, { start, end });
}

/**
 * Get previous/next month
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

/**
 * Get remaining days in current month
 */
export function getRemainingDaysInMonth(): number {
  const now = new Date();
  const endOfCurrentMonth = endOfMonth(now);
  return Math.ceil((endOfCurrentMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get month bounds from YYYY-MM format
 */
export function getMonthBoundsFromString(monthString: string): { start: string; end: string } {
  const [year, month] = monthString.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  return {
    start: formatDateForAPI(startDate),
    end: formatDateForAPI(endDate)
  };
}

/**
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonthString(monthString: string): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const prevMonth = getPreviousMonth(date);
  return format(prevMonth, 'yyyy-MM');
}

/**
 * Get next month in YYYY-MM format
 */
export function getNextMonthString(monthString: string): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const nextMonth = getNextMonth(date);
  return format(nextMonth, 'yyyy-MM');
}