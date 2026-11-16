import { calendarDate, MAX_REPORT_DAYS, periodError } from './report-period';

describe('periodError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T15:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  const day = (iso: string) => calendarDate(iso);

  it('accepts a period from 2020 up to today, with Dates or texts', () => {
    expect(periodError(day('2026-09-01'), day('2026-10-02'))).toBeNull();
    expect(periodError('2020-01-01', '2020-01-01')).toBeNull();
    expect(periodError(day('2026-10-02'), day('2026-10-02'))).toBeNull();
  });

  it('reports nothing while a date is missing', () => {
    expect(periodError(null, day('2026-10-02'))).toBeNull();
    expect(periodError(day('2026-10-02'), null)).toBeNull();
    expect(periodError(null, null)).toBeNull();
  });

  it('rejects dates before 2020', () => {
    expect(periodError(day('2019-12-31'), day('2026-10-02'))).toBe('minDate');
    expect(periodError(day('1900-01-01'), day('1900-01-02'))).toBe('minDate');
  });

  it('rejects dates after today in Lima', () => {
    expect(periodError(day('2026-09-01'), day('2026-10-03'))).toBe('futureDate');
    expect(periodError(day('2999-01-01'), day('2999-01-02'))).toBe('futureDate');
  });

  it('rejects an end before the start', () => {
    expect(periodError(day('2026-10-02'), day('2026-10-01'))).toBe('dateRange');
  });

  it('limits the number of days when a maximum is given', () => {
    expect(periodError('2025-10-02', '2026-10-02', MAX_REPORT_DAYS)).toBeNull();
    expect(periodError('2025-10-01', '2026-10-02', MAX_REPORT_DAYS)).toBe('tooLong');
    expect(periodError('2020-01-01', '2026-10-02')).toBeNull();
  });
});
