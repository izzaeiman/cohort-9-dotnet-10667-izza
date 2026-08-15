/**
 * Local calendar date helper (DST and timezone safe)
 * Formats current local date as YYYY-MM-DD
 */
export const getLocalDate = (): string => {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split('T')[0];
};
