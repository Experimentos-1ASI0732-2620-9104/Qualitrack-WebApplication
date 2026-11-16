import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RaStore } from '../../../application/ra.store';
import { calendarDate } from '../../utils/report-period';
import { AuditLogViewerComponent } from './audit-log-viewer';

describe('AuditLogViewerComponent', () => {
  const loadAuditLog = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T15:00:00Z'));
    loadAuditLog.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  function create() {
    TestBed.configureTestingModule({
      imports: [AuditLogViewerComponent],
      // The tabs of the page header are router links
      providers: [provideRouter([]), provideTranslateService(), provideHttpClient(), provideHttpClientTesting()],
    });
    vi.spyOn(TestBed.inject(RaStore), 'loadAuditLog').mockImplementation(loadAuditLog);
    const fixture = TestBed.createComponent(AuditLogViewerComponent);
    fixture.detectChanges();
    loadAuditLog.mockClear();
    return fixture.componentInstance as unknown as {
      filters: { equipmentId: number | null; batchId: number | null; dateFrom: Date | null; dateTo: Date | null };
      periodProblem: string | null;
      filtersValid: boolean;
      isInvalidId(value: number | null): boolean;
      loadLogs(): void;
    };
  }

  it('searches with no filters and with valid ones', () => {
    const component = create();
    component.loadLogs();
    expect(loadAuditLog).toHaveBeenCalledWith(undefined);
    component.filters.equipmentId = 4;
    component.filters.dateFrom = calendarDate('2026-09-01');
    component.filters.dateTo = calendarDate('2026-10-02');
    expect(component.filtersValid).toBe(true);
    component.loadLogs();
    expect(loadAuditLog).toHaveBeenLastCalledWith(expect.objectContaining({ equipmentId: 4 }));
  });

  it.each([
    ['1900-01-01', '2026-10-02', 'minDate'],
    ['2026-09-01', '2026-10-03', 'futureDate'],
    ['2026-10-02', '2026-10-01', 'dateRange'],
  ])('does not search with the period %s to %s (%s)', (from, to, problem) => {
    const component = create();
    component.filters.dateFrom = calendarDate(from);
    component.filters.dateTo = calendarDate(to);
    expect(component.periodProblem).toBe(problem);
    component.loadLogs();
    expect(loadAuditLog).not.toHaveBeenCalled();
  });

  it.each([[0], [-3], [1.5]])('rejects the identifier %s', id => {
    const component = create();
    expect(component.isInvalidId(id)).toBe(true);
    component.filters.batchId = id;
    component.loadLogs();
    expect(loadAuditLog).not.toHaveBeenCalled();
  });

  it('accepts a positive whole identifier and an empty one', () => {
    const component = create();
    expect(component.isInvalidId(7)).toBe(false);
    expect(component.isInvalidId(null)).toBe(false);
  });
});
