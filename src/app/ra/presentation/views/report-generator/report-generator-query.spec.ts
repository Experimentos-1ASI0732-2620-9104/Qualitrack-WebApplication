import { convertToParamMap } from '@angular/router';

import { reportConfigFromQuery } from './report-generator-query';

describe('report generator query', () => {
  it('reads the type, the environment and the days of the address', () => {
    expect(
      reportConfigFromQuery(
        convertToParamMap({
          type: 'compliance',
          environmentId: '3',
          from: '2026-09-01',
          to: '2026-09-30',
        }),
      ),
    ).toEqual({
      type: 'compliance',
      environmentId: 3,
      startDate: new Date(2026, 8, 1),
      endDate: new Date(2026, 8, 30),
    });
  });

  it('leaves out what is missing or not valid', () => {
    expect(reportConfigFromQuery(convertToParamMap({}))).toEqual({});
    expect(
      reportConfigFromQuery(
        convertToParamMap({ type: 'sales', environmentId: 'x', from: '2026-02-30', to: 'today' }),
      ),
    ).toEqual({});
  });
});
