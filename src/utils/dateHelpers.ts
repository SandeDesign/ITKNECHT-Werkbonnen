/**
 * Utility functions for date calculations in work orders
 * FIXED: Added precise date boundary functions to prevent statistical inflation
 */

/**
 * Get the day of the week in Dutch from a date string
 */
export const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return days[date.getDay()];
};

/**
 * Get the week number from a date string
 */
export const getWeekNumber = (dateString: string): number => {
  const date = new Date(dateString);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

/**
 * Format a date string to YYYY-MM-DD format for input fields
 */
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Convert a date string to ISO string for storage
 */
export const dateToISOString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString();
};

// NEW PRECISE DATE BOUNDARY FUNCTIONS TO FIX STATISTICS

/**
 * Get the start of the current week (Monday 00:00:00.000)
 * CRITICAL: This ensures accurate weekly filtering
 */
export const getStartOfWeek = (): string => {
  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so subtract 6 to get to Monday
  monday.setDate(now.getDate() - daysToSubtract);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

/**
 * Get the end of the current week (Sunday 23:59:59.999)
 * CRITICAL: This ensures accurate weekly filtering
 */
export const getEndOfWeek = (): string => {
  const now = new Date();
  const sunday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // If Sunday, stay; otherwise go to next Sunday
  sunday.setDate(now.getDate() + daysToAdd);
  sunday.setHours(23, 59, 59, 999);
  return sunday.toISOString();
};

/**
 * Get the start of the current month (1st day 00:00:00.000)
 * CRITICAL: This ensures accurate monthly filtering
 */
export const getStartOfMonth = (): string => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth.toISOString();
};

/**
 * Get the end of the current month (last day 23:59:59.999)
 * CRITICAL: This ensures accurate monthly filtering
 */
export const getEndOfMonth = (): string => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth.toISOString();
};

/**
 * Get the start of the current quarter (1st day of quarter 00:00:00.000)
 * CRITICAL: This ensures accurate quarterly filtering
 */
export const getStartOfQuarter = (): string => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
  startOfQuarter.setHours(0, 0, 0, 0);
  return startOfQuarter.toISOString();
};

/**
 * Get the end of the current quarter (last day of quarter 23:59:59.999)
 * CRITICAL: This ensures accurate quarterly filtering
 */
export const getEndOfQuarter = (): string => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  endOfQuarter.setHours(23, 59, 59, 999);
  return endOfQuarter.toISOString();
};

/**
 * Debug function to validate date calculations
 * CRITICAL: Use this to verify statistics accuracy
 */
export const validateDateRange = (label: string, startDate: string, endDate: string) => {
  console.log(`📊 ${label} Date Range Validation:`, {
    start: startDate,
    end: endDate,
    startReadable: new Date(startDate).toLocaleString('nl-NL'),
    endReadable: new Date(endDate).toLocaleString('nl-NL'),
    durationHours: (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60)
  });
};