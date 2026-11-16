import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { CaStore } from '../../../application/ca.store';
import {
  AlertSeverity,
  AlertStatus,
  DeviationAlert,
} from '../../../domain/model/deviation-alert.entity';
import { AlertHistory } from './alert-history';
import { IamStore } from '../../../../iam/application/iam.store';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const alertOf = (
  id: number,
  severity: AlertSeverity = 'WARNING',
  status: AlertStatus = 'RESOLVED',
  timestamp = daysAgo(2),
) =>
  new DeviationAlert({
    id,
    environmentId: 1,
    origin: 'ENVIRONMENT',
    equipmentId: 1,
    parameterName: 'HUMIDITY',
    recordedValue: 71,
    thresholdValue: 70,
    unit: '%RH',
    timestamp,
    severity,
    status,
  });

describe('AlertHistory', () => {
  const store = {
    environments: signal([
      { id: 1, code: 'E1', name: 'One' },
      { id: 2, code: 'E2', name: 'Two' },
    ]),
    environmentsLoaded: signal(true),
    environmentsEmpty: signal(false),
    alerts: signal<DeviationAlert[]>([]),
    loading: signal(false),
    error: signal<string | null>(null),
    unavailableEnvironmentIds: signal<number[]>([]),
    clearError: vi.fn(),
    clearAlerts: vi.fn(),
    loadDevices: vi.fn(),
    loadPeople: vi.fn(),
    loadEnvironments: vi.fn(),
    loadAlertHistory: vi.fn(),
    rememberEnvironment: vi.fn(),
    deviceName: () => 'Monitor ALM-MP',
    personName: () => 'Billy Ruiz',
  };
  let harness: RouterTestingHarness;

  async function open(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        { provide: IamStore, useValue: { canManageQuality: () => true } },
        { provide: CaStore, useValue: store },
        provideTranslateService(),
        provideRouter([{ path: 'alerts/history', component: AlertHistory }]),
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, AlertHistory);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  const activeTabOf = (page: HTMLElement) =>
    page.querySelector('a[mat-tab-link]')?.getAttribute('href');
  const rowsOf = (page: HTMLElement) => page.querySelectorAll('app-alert-table tbody tr').length;
  const chipNamed = (page: HTMLElement, key: string) =>
    [...page.querySelectorAll<HTMLButtonElement>('app-filter-chip button')].find((button) =>
      button.textContent?.includes(key),
    )!;
  const currentUrl = () => TestBed.inject(Router).url;

  beforeEach(() => {
    vi.clearAllMocks();
    store.alerts.set([]);
  });

  it('reads the environments again, because one can have been created', async () => {
    await open('/alerts/history');
    expect(store.loadEnvironments).toHaveBeenCalledTimes(1);
  });

  it('reads every environment unless the address chooses one', async () => {
    const page = await open('/alerts/history');
    expect(store.loadAlertHistory).toHaveBeenCalledWith(null);
    expect(activeTabOf(page)).toBe('/alerts');
  });

  it('reads the environment of the address and carries it to the active alerts', async () => {
    const page = await open('/alerts/history?environmentId=2');
    expect(store.loadAlertHistory).toHaveBeenCalledWith(2);
    expect(activeTabOf(page)).toBe('/alerts?environmentId=2');
  });

  it('ignores an environment of the address that does not exist', async () => {
    await open('/alerts/history?environmentId=99');
    expect(store.loadAlertHistory).toHaveBeenCalledWith(null);
  });

  it('marks the history as the current section', async () => {
    const page = await open('/alerts/history');
    const tabs = [...page.querySelectorAll('a[mat-tab-link]')];
    expect(tabs[1].classList.contains('mdc-tab--active')).toBe(true);
  });

  it('exports the period and the environment to the report generator', async () => {
    const page = await open(
      '/alerts/history?environmentId=2&period=custom&from=2026-09-01&to=2026-09-30',
    );

    const href = page.querySelector('a[href^="/reports/new"]')?.getAttribute('href');
    expect(href).toBe('/reports/new?type=compliance&environmentId=2&from=2026-09-01&to=2026-09-30');
  });

  it('says that the report does not follow the chips or the search, only when they narrow the table', async () => {
    store.alerts.set([alertOf(1, 'CRITICAL'), alertOf(2)]);
    const note = (page: HTMLElement) => page.querySelector('.export-note');

    expect(note(await open('/alerts/history?period=30'))).toBeNull();
    TestBed.resetTestingModule();
    expect(note(await open('/alerts/history?severity=CRITICAL'))?.textContent).toContain('ca-alerts.history.export-note');
    TestBed.resetTestingModule();
    expect(note(await open('/alerts/history?q=sala'))).not.toBeNull();
  });

  it('does not leave a step in the browser history for each digit of a date being typed', async () => {
    store.alerts.set([alertOf(1)]);
    const page = await open('/alerts/history?period=custom');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    const from = page.querySelector<HTMLInputElement>('input[type=date]')!;
    from.value = '0202-10-01';
    from.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();

    expect(currentUrl()).toBe('/alerts/history?period=custom&from=0202-10-01');
    expect(navigate.mock.calls[0][1]?.replaceUrl).toBe(true);
  });

  it('opens with the other filters when a day of the address does not exist', async () => {
    store.alerts.set([alertOf(1)]);

    expect(rowsOf(await open('/alerts/history?period=custom&to=2026-13-45'))).toBe(1);
  });

  it('shows only the alerts of the chips in the address, and tells how many each chip leaves', async () => {
    store.alerts.set([alertOf(1, 'CRITICAL'), alertOf(2), alertOf(3)]);

    const page = await open('/alerts/history?severity=CRITICAL');

    expect(rowsOf(page)).toBe(1);
    const warning = chipNamed(page, 'ca-alerts.severity.warning');
    expect(warning.getAttribute('aria-pressed')).toBe('false');
    expect(warning.querySelector('.count')?.textContent).toBe('2');
  });

  it('leaves out the alerts older than the period', async () => {
    store.alerts.set([alertOf(1), alertOf(2, 'WARNING', 'RESOLVED', daysAgo(40))]);

    expect(rowsOf(await open('/alerts/history?period=30'))).toBe(1);
  });

  it('writes the chip pressed in the address', async () => {
    store.alerts.set([alertOf(1, 'CRITICAL'), alertOf(2)]);
    const page = await open('/alerts/history?environmentId=1');
    chipNamed(page, 'ca-alerts.status.resolved').click();
    await harness.fixture.whenStable();

    expect(currentUrl()).toBe('/alerts/history?environmentId=1&status=RESOLVED');
  });

  it('offers to clear the filters when they leave nothing, keeping the environment', async () => {
    store.alerts.set([alertOf(1)]);
    const page = await open('/alerts/history?environmentId=1&severity=CRITICAL');

    const clear = page.querySelector<HTMLButtonElement>('app-empty-state button')!;
    clear.click();
    await harness.fixture.whenStable();

    expect(currentUrl()).toBe('/alerts/history?environmentId=1');
  });

  it('shows 10 alerts per page, with the paginator for the rest', async () => {
    store.alerts.set(Array.from({ length: 26 }, (_, index) => alertOf(index + 1)));

    const page = await open('/alerts/history');

    expect(rowsOf(page)).toBe(10);
    expect(page.querySelector('app-table-paginator mat-paginator')).not.toBeNull();
  });
});
