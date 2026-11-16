import { convertToParamMap } from '@angular/router';

import { DEFAULT_ALERT_HISTORY_FILTER } from '../domain/model/alert-history-filter';
import { filterFromQuery, queryFromFilter, reportQueryOf } from './alert-history-query';

describe('alert history query', () => {
  it('opens with the default filter when the address says nothing', () => {
    expect(filterFromQuery(convertToParamMap({}))).toEqual(DEFAULT_ALERT_HISTORY_FILTER);
  });

  it('reads the period, the days, the chips and the search of the address', () => {
    const filter = filterFromQuery(
      convertToParamMap({
        period: 'custom',
        from: '2026-09-01',
        to: '2026-09-30',
        severity: 'WARNING,CRITICAL',
        status: 'RESOLVED',
        origin: 'CONTAINER',
        q: 'humedad',
      }),
    );

    expect(filter).toEqual({
      period: null,
      from: '2026-09-01',
      to: '2026-09-30',
      severities: ['CRITICAL', 'WARNING'],
      statuses: ['RESOLVED'],
      origins: ['CONTAINER'],
      search: 'humedad',
    });
  });

  it('drops what is not valid instead of failing', () => {
    const filter = filterFromQuery(
      convertToParamMap({ period: '15', from: 'yesterday', severity: 'HIGH,LOW' }),
    );

    expect(filter.period).toBe(90);
    expect(filter.from).toBeNull();
    expect(filter.severities).toEqual(['LOW']);
  });

  it.each(['2026-13-45', '2026-02-31', '9999-99-99'])('drops the day %s, which does not exist', (day) => {
    const filter = filterFromQuery(convertToParamMap({ period: 'custom', from: day, to: day }));

    expect(filter.from).toBeNull();
    expect(filter.to).toBeNull();
    expect(() => reportQueryOf(filter, null, new Date('2026-10-10T03:00:00Z'))).not.toThrow();
  });

  it('keeps a year being typed, so the date box is not emptied under the person', () => {
    expect(filterFromQuery(convertToParamMap({ period: 'custom', from: '0202-10-01' })).from).toBe('0202-10-01');
  });

  it('leaves the default values out of the address', () => {
    expect(queryFromFilter(DEFAULT_ALERT_HISTORY_FILTER)).toEqual({
      period: null,
      from: null,
      to: null,
      severity: null,
      status: null,
      origin: null,
      q: null,
    });
  });

  it('writes a filter that reads back the same', () => {
    const filter = {
      ...DEFAULT_ALERT_HISTORY_FILTER,
      period: 7 as const,
      severities: ['CRITICAL' as const],
      search: 'almacén',
    };

    const query = queryFromFilter(filter);

    expect(query).toMatchObject({ period: 7, severity: 'CRITICAL', q: 'almacén' });
    const address = Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value !== null)
        .map(([name, value]) => [name, String(value)]),
    );
    expect(filterFromQuery(convertToParamMap(address))).toEqual(filter);
  });

  it('exports the period and the environment as a compliance report, in days of Peru', () => {
    const now = new Date('2026-10-10T03:00:00Z');

    expect(reportQueryOf({ ...DEFAULT_ALERT_HISTORY_FILTER, period: 7 }, 3, now)).toEqual({
      type: 'compliance',
      environmentId: 3,
      from: '2026-10-02',
      to: '2026-10-09',
    });
    expect(
      reportQueryOf({ ...DEFAULT_ALERT_HISTORY_FILTER, period: null, to: '2026-09-30' }, null, now),
    ).toEqual({ type: 'compliance', environmentId: null, from: null, to: '2026-09-30' });
  });
});
