import { localIsoDate, todayInLima } from './local-date';

describe('todayInLima', () => {
  it('uses the calendar day of Lima, which is UTC-5', () => {
    expect(todayInLima(new Date('2026-10-02T03:30:00Z'))).toBe('2026-10-01');
    expect(todayInLima(new Date('2026-10-02T05:00:00Z'))).toBe('2026-10-02');
    expect(todayInLima(new Date('2026-10-02T23:59:00Z'))).toBe('2026-10-02');
  });
});

describe('localIsoDate', () => {
  it('formats the calendar day of the browser', () => {
    expect(localIsoDate(new Date(2026, 9, 2, 23, 30))).toBe('2026-10-02');
  });
});
