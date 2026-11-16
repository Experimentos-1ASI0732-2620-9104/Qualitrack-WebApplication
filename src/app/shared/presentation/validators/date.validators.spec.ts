import { FormControl, FormGroup } from '@angular/forms';
import {
  addYears,
  afterDateValidator,
  dateRangeValidator,
  maxDateValidator,
  minDateValidator,
  noFutureDateValidator,
  toIsoDate,
} from './date.validators';

describe('toIsoDate', () => {
  it('reads a date input text and a Date', () => {
    expect(toIsoDate('2026-10-02')).toBe('2026-10-02');
    expect(toIsoDate(new Date(2026, 9, 2))).toBe('2026-10-02');
  });

  it.each(['', '2026-13-01', '2026-02-30', '02/10/2026', 'today', '26-10-02'])('rejects %s', value =>
    expect(toIsoDate(value)).toBeNull(),
  );

  it('rejects an invalid Date and an empty value', () => {
    expect(toIsoDate(new Date('x'))).toBeNull();
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(undefined)).toBeNull();
  });
});

describe('addYears', () => {
  it('shifts the year', () => {
    expect(addYears('2026-10-02', 5)).toBe('2031-10-02');
    expect(addYears('2026-10-02', -1)).toBe('2025-10-02');
  });
});

describe('minDateValidator', () => {
  const check = (value: unknown, min?: string) => minDateValidator(min)(new FormControl(value));

  it('accepts 2020-01-01 and later', () => {
    expect(check('2020-01-01')).toBeNull();
    expect(check('2026-10-02')).toBeNull();
    expect(check(new Date(2024, 5, 1))).toBeNull();
  });

  it('rejects earlier dates', () => {
    expect(check('2019-12-31')).toEqual({ minDate: { min: '2020-01-01' } });
    expect(check('1900-01-01')).toEqual({ minDate: { min: '2020-01-01' } });
    expect(check(new Date(1999, 0, 1))).toEqual({ minDate: { min: '2020-01-01' } });
  });

  it('accepts another minimum', () => {
    expect(check('2023-12-31', '2024-01-01')).toEqual({ minDate: { min: '2024-01-01' } });
  });

  it('reports a value that is not a date and ignores an empty one', () => {
    expect(check('2026-02-30')).toEqual({ invalidDate: true });
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });
});

describe('maxDateValidator and noFutureDateValidator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T03:30:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('treats today as the day in Lima', () => {
    const check = (value: string) => noFutureDateValidator()(new FormControl(value));
    expect(check('2026-10-01')).toBeNull();
    expect(check('2026-10-02')).toEqual({ futureDate: true });
  });

  it('follows the clock', () => {
    const control = new FormControl('2026-10-02');
    expect(noFutureDateValidator()(control)).toEqual({ futureDate: true });
    vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
    expect(noFutureDateValidator()(control)).toBeNull();
  });

  it('accepts a fixed or computed maximum', () => {
    expect(maxDateValidator('2030-01-01')(new FormControl('2030-01-02'))).toEqual({ maxDate: { max: '2030-01-01' } });
    expect(maxDateValidator(() => '2030-01-01')(new FormControl('2030-01-01'))).toBeNull();
  });

  it('reports a value that is not a date and ignores an empty one', () => {
    expect(noFutureDateValidator()(new FormControl('abc'))).toEqual({ invalidDate: true });
    expect(noFutureDateValidator()(new FormControl(''))).toBeNull();
  });
});

describe('afterDateValidator', () => {
  const start = new FormControl('2026-10-01');
  const check = (value: unknown, strict = false) =>
    afterDateValidator(() => start.value, strict)(new FormControl(value));

  it('accepts the same day unless strict', () => {
    expect(check('2026-10-01')).toBeNull();
    expect(check('2026-10-01', true)).toEqual({ dateOrder: true });
  });

  it('accepts a later day and rejects an earlier one', () => {
    expect(check('2026-10-02', true)).toBeNull();
    expect(check('2026-09-30')).toEqual({ dateOrder: true });
  });

  it('checks nothing when the reference is empty', () => {
    start.setValue('');
    expect(check('2020-01-01')).toBeNull();
    start.setValue('2026-10-01');
  });
});

describe('dateRangeValidator', () => {
  const check = (start: unknown, end: unknown) =>
    dateRangeValidator('start', 'end')(new FormGroup({ start: new FormControl(start), end: new FormControl(end) }));

  it('accepts an end on or after the start', () => {
    expect(check('2026-10-01', '2026-10-01')).toBeNull();
    expect(check('2026-10-01', '2026-10-31')).toBeNull();
  });

  it('rejects an end before the start', () => {
    expect(check('2026-10-02', '2026-10-01')).toEqual({ dateRange: true });
  });

  it('checks nothing when a date is missing', () => {
    expect(check('2026-10-02', '')).toBeNull();
    expect(check(null, '2026-10-01')).toBeNull();
  });
});
