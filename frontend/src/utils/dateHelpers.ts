/**
 * Local calendar date helper (DST and timezone safe)
 * Formats current local date as YYYY-MM-DD
 */
export const getLocalDate = (inputDate?: Date): string => {
  const date = inputDate || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
