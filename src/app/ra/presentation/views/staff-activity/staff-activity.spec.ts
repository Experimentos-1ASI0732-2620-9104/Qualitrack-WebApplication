import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { RaStore } from '../../../application/ra.store';
import { AuditLogEntry } from '../../../domain/model/audit-log-entry.entity';
import { AuditedStaffMember } from '../../../domain/model/audited-staff-member.entity';
import { StaffActivity } from './staff-activity';

describe('StaffActivity', () => {
  const activity = signal<AuditLogEntry[]>([]);
  const params = new BehaviorSubject(convertToParamMap({ staffId: '2' }));
  const entry = (id: number, type: string) => new AuditLogEntry({ id, entityType: type, timestamp: '2026-10-01T00:00:00Z', action: 'CREATE', entityId: id, performedBy: 1, details: '' });
  const loadStaffActivity = vi.fn();
  beforeEach(() => {
    params.next(convertToParamMap({ staffId: '2' }));
    activity.set([entry(3, 'EQUIPMENT'), entry(2, 'BATCH'), entry(1, 'EQUIPMENT')]);
    loadStaffActivity.mockClear();
    TestBed.configureTestingModule({ imports: [StaffActivity], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: RaStore, useValue: {
        staffActivity: activity, auditedStaffMember: signal(new AuditedStaffMember({ id: 2, fullName: 'Ana', role: 'Operator' })),
        staffActivityLoading: signal(false), staffActivityError: signal(null), loadStaffActivity, clearStaffActivity: vi.fn(),
      } },
    ] });
  });
  it('filters the table by type and restores every entry with ALL', () => {
    const fixture = TestBed.createComponent(StaffActivity);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page['entityTypes']()).toEqual(['BATCH', 'EQUIPMENT']);
    page['entityFilter'].set('EQUIPMENT'); fixture.detectChanges();
    expect(page['visibleActivity']().map((e) => e.id)).toEqual([3, 1]);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    page['entityFilter'].set('ALL'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });
  it('resets the filter and requests the next staff member when the route changes', () => {
    const fixture = TestBed.createComponent(StaffActivity); fixture.detectChanges();
    fixture.componentInstance['entityFilter'].set('BATCH');
    params.next(convertToParamMap({ staffId: '3' }));
    expect(fixture.componentInstance['entityFilter']()).toBe('ALL');
    expect(loadStaffActivity).toHaveBeenLastCalledWith(3);
  });
  it('keeps unknown entities and actions readable and has no last activity for an empty log', () => {
    const fixture = TestBed.createComponent(StaffActivity); fixture.detectChanges();
    expect(fixture.componentInstance['entityKey']('CUSTOM_RECORD')).toBeNull();
    expect(fixture.componentInstance['actionKey']('CUSTOM_ACTION')).toBeNull();
    activity.set([]);
    expect(fixture.componentInstance['lastActivity']()).toBeNull();
  });
});
