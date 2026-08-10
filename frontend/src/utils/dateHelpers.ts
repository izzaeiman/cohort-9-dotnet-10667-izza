/**
 * Local calendar date helper (DST and timezone safe)
 * Formats given or current local date as YYYY-MM-DD
 */
export const getLocalDate = (inputDate: Date = new Date()): string => {
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, '0');
  const day = String(inputDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
