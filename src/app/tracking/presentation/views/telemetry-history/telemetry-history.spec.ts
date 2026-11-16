import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingStore } from '../../../application/tracking.store';
import { TelemetryHistory } from './telemetry-history';
import { IamStore } from '../../../../iam/application/iam.store';

describe('TelemetryHistory', () => {
  const loadHistory = vi.fn().mockResolvedValue(undefined);

  function create() {
    TestBed.configureTestingModule({
      imports: [TelemetryHistory],
      providers: [
        { provide: IamStore, useValue: { canManageQuality: () => true } },
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } }, queryParamMap: { subscribe: () => ({ unsubscribe: () => undefined }) } } },
      ],
    });
    const store = TestBed.inject(TrackingStore);
    vi.spyOn(store, 'devices').mockReturnValue([{ id: 1 }] as never);
    vi.spyOn(store, 'loadHistory').mockImplementation(loadHistory);
    const fixture = TestBed.createComponent(TelemetryHistory);
    return fixture.componentInstance as unknown as {
      deviceId: number | null;
      from: string;
      to: string;
      periodError: () => boolean;
      search(): Promise<void>;
    };
  }

  beforeEach(() => loadHistory.mockClear());

  async function searchWith(from: string, to: string) {
    const component = create();
    component.deviceId = 1;
    component.from = from;
    component.to = to;
    await component.search();
    return component;
  }

  it('searches a valid period', async () => {
    const component = await searchWith('2026-09-20T08:00', '2026-10-01T08:00');
    expect(component.periodError()).toBe(false);
    expect(loadHistory).toHaveBeenCalled();
  });

  it.each([
    ['1900-01-01T00:00', '1900-01-05T00:00'],
    ['2019-12-31T23:00', '2020-01-02T00:00'],
    ['2026-10-02T00:00', '2026-10-01T00:00'],
    ['2026-01-01T00:00', '2026-03-01T00:00'],
  ])('rejects the period %s to %s', async (from, to) => {
    const component = await searchWith(from, to);
    expect(component.periodError()).toBe(true);
    expect(loadHistory).not.toHaveBeenCalled();
  });
});
