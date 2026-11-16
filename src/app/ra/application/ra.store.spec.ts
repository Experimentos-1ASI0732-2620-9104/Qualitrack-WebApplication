import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { RaApi } from '../infrastructure/ra-api';
import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { AuditLogEntry } from '../domain/model/audit-log-entry.entity';
import { OverviewEnvironmentalProfile } from '../domain/model/overview-environmental-profile.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { RaStore } from './ra.store';

const entry = (id: number, timestamp: string) => new AuditLogEntry({
  id, timestamp, action: 'CREATE', entityType: 'BATCH', entityId: 1, performedBy: 1, details: '',
});
describe('RaStore staff activity', () => {
  const member = new AuditedStaffMember({ id: 2, fullName: 'Ana Pérez', role: 'Operator' });
  const api = { getAuditedStaffMember: vi.fn(), getStaffActivity: vi.fn() };
  beforeEach(() => {
    api.getAuditedStaffMember.mockReset().mockReturnValue(of(member));
    api.getStaffActivity.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true } },
      { provide: RaApi, useValue: api },
    ] });
  });
  it('sorts activity newest first without mutating the API result', () => {
    const entries = [entry(1, '2026-10-01T10:00:00Z'), entry(2, '2026-10-02T10:00:00Z')];
    api.getStaffActivity.mockReturnValue(of(entries));
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    expect(store.staffActivity().map((e) => e.id)).toEqual([2, 1]);
    expect(entries.map((e) => e.id)).toEqual([1, 2]);
    expect(store.auditedStaffMember()).toBe(member);
    expect(api.getAuditedStaffMember).toHaveBeenCalledWith(7, 2);
    expect(store.staffActivityLoading()).toBe(false);
  });
  it('cancels stale activity and clears previous data when the staff changes', () => {
    const stale = new Subject<AuditLogEntry[]>();
    api.getStaffActivity.mockReturnValueOnce(stale);
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    expect(store.staffActivityLoading()).toBe(true);
    store.loadStaffActivity(3);
    stale.next([entry(9, '2026-10-01T00:00:00Z')]); stale.complete();
    expect(store.staffActivity()).toEqual([]);
    store.clearStaffActivity();
    expect(store.auditedStaffMember()).toBeNull();
  });
  it('shows an error without retaining another staff member on failure', () => {
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(2);
    api.getStaffActivity.mockReturnValue(throwError(() => new Error('unavailable')));
    store.loadStaffActivity(3);
    expect(store.staffActivityError()).toBe('staff.detail.load-error');
    expect(store.auditedStaffMember()).toBeNull();
    expect(store.staffActivityLoading()).toBe(false);
  });
  it.each([0, -1, NaN, 1.5])('rejects an invalid identifier %s before requesting data', (id) => {
    const store = TestBed.inject(RaStore);
    store.loadStaffActivity(id);
    expect(api.getStaffActivity).not.toHaveBeenCalled();
    expect(store.staffActivityError()).toBe('staff.detail.load-error');
  });
});

describe('RaStore report preview', () => {
  const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  const api = { generateComplianceReport: vi.fn() };
  const order = (endDate: string) => ({
    type: 'compliance' as const,
    command: { laboratoryId: 7, environmentId: null, startDate: '2026-10-01', endDate, format: 'PDF' as const },
  });
  beforeEach(() => {
    api.generateComplianceReport.mockReset().mockReturnValue(of(pdf));
    URL.createObjectURL = vi.fn(() => 'blob:report');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true } },
      { provide: RaApi, useValue: api },
    ] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('downloads the previewed report without generating it again', async () => {
    const store = TestBed.inject(RaStore);
    expect(await store.previewReport(order('2026-10-07'))).toBe(pdf);
    store.generateReport(order('2026-10-07'));
    expect(api.generateComplianceReport).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(store.successMsg()).toBe('report-generator.success.compliance');
  });

  it('generates a new report when the parameters changed or the preview was forgotten', async () => {
    const store = TestBed.inject(RaStore);
    await store.previewReport(order('2026-10-07'));
    store.generateReport(order('2026-10-08'));
    expect(api.generateComplianceReport).toHaveBeenCalledTimes(2);
    store.clearReportPreview();
    store.generateReport(order('2026-10-07'));
    expect(api.generateComplianceReport).toHaveBeenCalledTimes(3);
  });

  it('shows why the preview failed and keeps nothing to download', async () => {
    api.generateComplianceReport.mockReturnValue(throwError(() => new Error('report-generator.errors.connection')));
    const store = TestBed.inject(RaStore);
    expect(await store.previewReport(order('2026-10-07'))).toBeNull();
    expect(store.error()).toBe('report-generator.errors.connection');
    expect(store.isLoading()).toBe(false);
    store.downloadPreview();
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});

describe('RaStore environmental profiles', () => {
  const equipment = (id: number, deviceType: string) =>
    new OverviewEquipment({ id, laboratoryId: 7, environmentId: 1, name: `Device ${id}`, deviceType });
  const profile = new OverviewEnvironmentalProfile(1, 'ENVIRONMENT', 7, 1, 11, 1, [], [], null, null);
  const api = {
    getOverviewEquipment: vi.fn(),
    getOverviewEnvironmentalProfile: vi.fn(),
    getOverviewContainerMonitorProfile: vi.fn(),
  };

  function storeWithEquipment() {
    const store = TestBed.inject(RaStore);
    store.loadEquipment();
    return store;
  }

  beforeEach(() => {
    api.getOverviewEquipment.mockReset().mockReturnValue(of([equipment(11, 'ENVIRONMENTAL_DEVICE'), equipment(12, 'CONTAINER_MONITOR')]));
    api.getOverviewEnvironmentalProfile.mockReset().mockReturnValue(of(profile));
    api.getOverviewContainerMonitorProfile.mockReset().mockReturnValue(of(profile));
    TestBed.configureTestingModule({ providers: [
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true } },
      { provide: RaApi, useValue: api },
    ] });
  });

  it('reads the profile that applies to each type of device', () => {
    const store = storeWithEquipment();
    store.loadProfile(11, 1);
    store.loadProfile(12, 1);
    expect(api.getOverviewEnvironmentalProfile).toHaveBeenCalledWith(7, 1);
    expect(api.getOverviewContainerMonitorProfile).toHaveBeenCalledWith(7, 1, 12);
    expect(store.profiles()[12]).toBe(profile);
  });

  it('asks for a profile once, even while its answer has not arrived', () => {
    const pending = new Subject<OverviewEnvironmentalProfile | null>();
    api.getOverviewContainerMonitorProfile.mockReturnValue(pending);
    const store = storeWithEquipment();
    store.loadProfile(12, 1);
    store.loadProfile(12, 1);
    expect(api.getOverviewContainerMonitorProfile).toHaveBeenCalledTimes(1);
    pending.next(profile);
    store.loadProfile(12, 1);
    expect(api.getOverviewContainerMonitorProfile).toHaveBeenCalledTimes(1);
  });

  it('waits for the equipment, because the type of the device decides which profile applies', () => {
    const pending = new Subject<OverviewEquipment[]>();
    api.getOverviewEquipment.mockReturnValue(pending);
    const store = storeWithEquipment();
    store.loadProfile(12, 1);
    expect(api.getOverviewEnvironmentalProfile).not.toHaveBeenCalled();
    expect(api.getOverviewContainerMonitorProfile).not.toHaveBeenCalled();
    pending.next([equipment(12, 'CONTAINER_MONITOR')]);
    store.loadProfile(12, 1);
    expect(api.getOverviewEnvironmentalProfile).not.toHaveBeenCalled();
    expect(api.getOverviewContainerMonitorProfile).toHaveBeenCalledTimes(1);
  });

  it('reads a profile again after forgetting them', () => {
    const store = storeWithEquipment();
    store.loadProfile(11, 1);
    store.clearProfiles();
    expect(store.profiles()).toEqual({});
    store.loadProfile(11, 1);
    expect(api.getOverviewEnvironmentalProfile).toHaveBeenCalledTimes(2);
  });
});
