/**
 * Date utility functions for graceful date formatting and display
 */

/**
 * Formats a date string or Date object into a user-friendly format
 * @param date - Date string, Date object, or null/undefined
 * @param options - Formatting options
 * @returns Formatted date string or fallback text
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options: {
    format?: 'short' | 'medium' | 'long' | 'relative';
    fallback?: string;
  } = {}
): string => {
  const { format = 'medium', fallback = '--' } = options;

  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Relative format for recent dates
    if (format === 'relative') {
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays === -1) return 'Tomorrow';
      if (diffInDays > 1 && diffInDays <= 7) return `${diffInDays} days ago`;
      if (diffInDays < -1 && diffInDays >= -7) return `In ${Math.abs(diffInDays)} days`;
    }

    // Standard formats
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata', // Indian timezone
    };

    switch (format) {
      case 'short':
        formatOptions.day = '2-digit';
        formatOptions.month = '2-digit';
        formatOptions.year = '2-digit';
        break;
      case 'medium':
        formatOptions.day = '2-digit';
        formatOptions.month = 'short';
        formatOptions.year = 'numeric';
        break;
      case 'long':
        formatOptions.weekday = 'long';
        formatOptions.day = '2-digit';
        formatOptions.month = 'long';
        formatOptions.year = 'numeric';
        break;
    }

    // Intentionally not including time in this formatter for current views

    return new Intl.DateTimeFormat('en-IN', formatOptions).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Formats a date for display in tables and lists
 * @param date - Date string, Date object, or null/undefined
 * @param includeTime - Whether to include time information
 * @returns Formatted date string
 */
export const formatTableDate = (date: string | Date | null | undefined, _includeTime: boolean = false): string => {
  // _includeTime is ignored intentionally; showing date-only in current views
  return formatDate(date, { format: 'medium', fallback: '--' });
};

/**
 * Formats a date with relative time for recent dates
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string with relative time
 */
export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  return formatDate(date, { format: 'relative', fallback: '--' });
};

/**
 * Formats a date with time for detailed views
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string with time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  // Show date-only for now; time suppressed in formatter
  return formatDate(date, { format: 'medium', fallback: '--' });
};

/**
 * Formats a date with time in a compact format for tables
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string with time in compact format
 */
export const formatCompactDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '--';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '--';
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
      // hour12: true,
    };

    return new Intl.DateTimeFormat('en-IN', formatOptions).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '--';
  }
};

/**
 * Checks if a date is in the past
 * @param date - Date string, Date object, or null/undefined
 * @returns boolean indicating if date is in the past
 */
export const isPastDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return false;
    
    return dateObj < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Checks if a date is today
 * @param date - Date string, Date object, or null/undefined
 * @returns boolean indicating if date is today
 */
export const isToday = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return false;
    
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Gets a user-friendly status for date-based fields
 * @param date - Date string, Date object, or null/undefined
 * @param isDeadline - Whether this is a deadline date
 * @param includeTime - Whether to include time information
 * @returns Status text and styling info
 */
export const getDateStatus = (
  date: string | Date | null | undefined,
  isDeadline: boolean = false,
  /* includeTime: boolean = false */
): { text: string; className: string; isOverdue: boolean } => {
  if (!date) {
    return { text: '--', className: 'text-muted', isOverdue: false };
  }

  const isPast = isPastDate(date);
  const isTodayDate = isToday(date);
  // Time display is suppressed for now; keep includeTime commented for future use
  const formattedDate = formatTableDate(date);

  if (isDeadline) {
    if (isPast && !isTodayDate) {
      return { text: `${formattedDate} (Overdue)`, className: 'text-danger fw-semibold', isOverdue: true };
    }
    return { text: formattedDate, className: 'text-dark', isOverdue: false };
  }

  return { text: formattedDate, className: 'text-dark', isOverdue: false };
};
