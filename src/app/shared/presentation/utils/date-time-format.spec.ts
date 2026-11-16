import { formatDate, formatDateTime, formatElapsedTime, formatRelativeTime } from './date-time-format';

describe('formatDate', () => {
  it('shows the day of an instant in the time zone of the laboratories', () => {
    expect(formatDate('2026-10-05T03:00:00Z', 'es')).toBe('4 oct 2026');
    expect(formatDate('2026-10-05T03:00:00Z', 'en')).toBe('Oct 4, 2026');
  });

  it('shows a calendar day as it is, whatever the time zone', () => {
    expect(formatDate('2026-10-04', 'es')).toBe('4 oct 2026');
    expect(formatDate('2026-10-04', 'en')).toBe('Oct 4, 2026');
  });

  it('shows nothing without a valid date', () => {
    expect(formatDate(null, 'es')).toBe('');
    expect(formatDate('not a date', 'es')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formats in 24 hours, in the time zone of Lima and in the language of the application', () => {
    const instant = '2026-10-03T14:00:00Z';

    expect(formatDateTime(instant, 'es')).toBe('3 oct 2026, 09:00');
    expect(formatDateTime(instant, 'en')).toBe('Oct 3, 2026, 09:00');
  });

  it('keeps midnight as 00 instead of 24', () => {
    expect(formatDateTime('2026-10-05T05:11:00Z', 'en')).toBe('Oct 5, 2026, 00:11');
  });

  it('returns an empty text when there is no valid instant', () => {
    expect(formatDateTime(null, 'es')).toBe('');
    expect(formatDateTime('', 'es')).toBe('');
    expect(formatDateTime('not a date', 'es')).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-11-01T12:00:00Z');

  it('uses the largest unit that fits', () => {
    expect(formatRelativeTime('2026-11-01T11:59:48Z', 'en', now)).toBe('12 seconds ago');
    expect(formatRelativeTime('2026-11-01T11:55:00Z', 'en', now)).toBe('5 minutes ago');
    expect(formatRelativeTime('2026-11-01T09:00:00Z', 'en', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-10-04T12:00:00Z', 'en', now)).toBe('28 days ago');
  });

  it('follows the language of the application', () => {
    expect(formatRelativeTime('2026-10-04T12:00:00Z', 'es', now)).toBe('hace 28 días');
  });

  it('reads an instant ahead of the browser clock as the present', () => {
    expect(formatRelativeTime('2026-11-01T12:00:05Z', 'en', now)).toBe('now');
  });

  it('returns an empty text when there is no valid instant', () => {
    expect(formatRelativeTime(null, 'en', now)).toBe('');
  });
});

describe('formatElapsedTime', () => {
  const start = '2026-10-03T14:00:00Z';

  it('uses the largest unit that fits', () => {
    expect(formatElapsedTime(start, '2026-10-03T14:00:30Z', 'en')).toBe('30 sec');
    expect(formatElapsedTime(start, '2026-10-03T14:14:40Z', 'en')).toBe('14 min');
    expect(formatElapsedTime(start, '2026-10-03T16:30:00Z', 'en')).toBe('2 hours');
    expect(formatElapsedTime(start, '2026-10-06T15:00:00Z', 'en')).toBe('3 days');
  });

  it('follows the language of the application', () => {
    expect(formatElapsedTime(start, '2026-10-03T14:14:00Z', 'es')).toBe('14 min');
    expect(formatElapsedTime(start, '2026-11-02T14:00:00Z', 'es')).toBe('30 días');
  });

  it('reads a later start as no time at all', () => {
    expect(formatElapsedTime('2026-10-03T14:00:05Z', start, 'en')).toBe('0 sec');
  });

  it('returns an empty text when an instant is missing', () => {
    expect(formatElapsedTime(null, start, 'en')).toBe('');
    expect(formatElapsedTime(start, null, 'en')).toBe('');
  });
});
