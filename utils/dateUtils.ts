
/**
 * Returns the current date in Korea Standard Time (KST)
 */
export const getKSTDate = (): Date => {
  const now = new Date();
  const kstTime = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  return new Date(kstTime);
};

/**
 * Formats a date object to YYYY-MM-DD string for map keys
 */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets the first day of the month and the number of days in the month
 */
export const getMonthDetails = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
};

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
