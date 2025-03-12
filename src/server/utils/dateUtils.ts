// src/server/utils/dateUtils.ts
/**
 * Get the start of a day (midnight)
 */
export const startOfDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };
  
  /**
   * Get the end of a day (23:59:59.999)
   */
  export const endOfDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  };
  
  /**
   * Get the start of a week (Sunday)
   */
  export const startOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
    result.setDate(result.getDate() - day); // Go back to Sunday
    return startOfDay(result);
  };
  
  /**
   * Get the end of a week (Saturday)
   */
  export const endOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
    result.setDate(result.getDate() + (6 - day)); // Go forward to Saturday
    return endOfDay(result);
  };
  
  /**
   * Format a date as YYYY-MM-DD
   */
  export const formatDateToYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  /**
   * Parse a date string to a Date object
   */
  export const parseDate = (dateString: string): Date => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return date;
  };
  
  /**
   * Check if two dates are the same day
   */
  export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };