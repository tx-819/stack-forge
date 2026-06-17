import dayjs from 'dayjs';

export const DEFAULT_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function formatDateTime(
  value: string | number | Date | null | undefined,
  format = DEFAULT_DATE_TIME_FORMAT,
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const date = dayjs(value);
  return date.isValid() ? date.format(format) : '';
}
