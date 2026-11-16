import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { RaStore } from '../../../application/ra.store';
import { DeviationTrend } from '../../../domain/model/deviation-trend.entity';
import { DeviationChart } from '../../components/deviation-chart/deviation-chart';
import { DeviationTrendChartComponent } from './deviation-trend-chart';
import { IamStore } from '../../../../iam/application/iam.store';

/** The canvas of the real chart needs a browser. */
@Component({ selector: 'app-deviation-chart', template: '' })
class ChartStub {
  readonly trend = input<DeviationTrend>();
  readonly chartData = input<unknown>();
  readonly chartOptions = input<unknown>();
  readonly deviceLabel = input<unknown>();
  readonly thresholds = input<unknown>();
  readonly thresholdsPending = input(false);
  readonly openDetail = output<void>();
}

const trendOf = (equipmentId: number) =>
  new DeviationTrend({ id: null, parameterName: 'TEMPERATURE', equipmentId, unit: '°C', trendDirection: 'STABLE', dataPoints: [] });

describe('DeviationTrendChartComponent', () => {
  const store = {
    environments: signal([{ id: 1, code: 'E1', name: 'One' }, { id: 2, code: 'E2', name: 'Two' }]),
    environmentsEmpty: signal(false),
    environmentsLoaded: signal(true),
    deviationTrends: signal([trendOf(11), trendOf(12)]),
    profiles: signal({}),
    isLoading: signal(false),
    error: signal(null),
    deviceName: () => null,
    loadDevices: vi.fn(),
    loadEnvironments: vi.fn(),
    loadDeviationTrends: vi.fn(),
    loadProfile: vi.fn(),
    clearProfiles: vi.fn(),
    preferredEnvironmentId: vi.fn(() => 1),
    rememberEnvironment: vi.fn(),
  };

  async function open(url: string) {
    TestBed.overrideComponent(DeviationTrendChartComponent, {
      remove: { imports: [DeviationChart] },
      add: { imports: [ChartStub] },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: IamStore, useValue: { canManageQuality: () => true } },
        { provide: RaStore, useValue: store },
        provideTranslateService(),
        provideRouter([{ path: 'reports/deviation-trends', component: DeviationTrendChartComponent }]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    const view = await harness.navigateByUrl(url, DeviationTrendChartComponent);
    await harness.fixture.whenStable();
    return { harness, view: view as unknown as { select(trend: DeviationTrend): void; changePeriod(days: number): void; changeEnvironment(id: number): void } };
  }

  beforeEach(() => vi.clearAllMocks());

  it('reads the trends once when it opens, writing the preferred environment in the address', async () => {
    const { harness } = await open('/reports/deviation-trends');
    expect(store.loadDeviationTrends).toHaveBeenCalledTimes(1);
    expect(store.loadDeviationTrends.mock.calls[0][0]).toBe(1);
    expect(TestBed.inject(Router).url).toContain('env=1');
    expect(harness).toBeTruthy();
  });

  it('does not read the trends again when another row is chosen', async () => {
    const { harness, view } = await open('/reports/deviation-trends?env=1&days=7');
    store.loadDeviationTrends.mockClear();
    view.select(trendOf(12));
    await harness.fixture.whenStable();
    expect(store.loadDeviationTrends).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toContain('selected=');
  });

  it('reads the trends once when the period or the environment change', async () => {
    const { harness, view } = await open('/reports/deviation-trends?env=1&days=7');
    store.loadDeviationTrends.mockClear();
    view.changePeriod(31);
    await harness.fixture.whenStable();
    expect(store.loadDeviationTrends).toHaveBeenCalledTimes(1);
    view.changeEnvironment(2);
    await harness.fixture.whenStable();
    expect(store.loadDeviationTrends).toHaveBeenCalledTimes(2);
    expect(store.loadDeviationTrends.mock.calls[1][0]).toBe(2);
  });

  it('forgets the profiles of the previous visit, because they can have changed', async () => {
    await open('/reports/deviation-trends?env=1&days=7');
    expect(store.clearProfiles).toHaveBeenCalledTimes(1);
  });
});
