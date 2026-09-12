import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { DashboardStore } from './dashboard.store';
import { IamStore } from '../../iam/application/iam.store';
import { LaboratoryApi } from '../../laboratory/infrastructure/laboratory-api';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { CaApi } from '../../ca/infrastructure/ca-api';
import { TrackingApi } from '../../tracking/infrastructure/tracking-api';
import { SubscriptionApi } from '../../subscription/infrastructure/subscription-api';
import { Measurement } from '../../tracking/domain/model/measurement.entity';

describe('Dashboard composition', () => {
  const labId = 42;
  let store: DashboardStore;
  let measurements: Map<number, Subject<Measurement[]>>;
  let alerts: ReturnType<typeof vi.fn>;
  let equipment: ReturnType<typeof vi.fn>;
  let subscription: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    measurements = new Map([[4, new Subject()], [5, new Subject()]]);
    alerts = vi.fn(({ equipmentId }) => of([{ id: equipmentId, equipmentId,
      severity: equipmentId === 4 ? 'WARNING' : 'CRITICAL', status: equipmentId === 4 ? 'ACKNOWLEDGED' : 'UNRESOLVED',
      timestamp: '2026-09-05T12:00:00Z' }]));
    equipment = vi.fn(() => of([{ id: 4, labId }, { id: 5, labId }, { id: 99, labId: 99 }]));
    subscription = vi.fn(() => of({ id: 8, laboratoryId: labId, planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE' }));
    TestBed.configureTestingModule({ providers: [DashboardStore,
      { provide: IamStore, useValue: { requireLaboratoryId: () => labId } },
      { provide: LaboratoryApi, useValue: { getLaboratory: () => of({ id: labId, name: 'Lab' }),
        getRawMaterials: () => of([{ id: 1, laboratoryId: labId, quantityInStock: 4, minimumStock: 5 }]) } },
      { provide: EquipmentApi, useValue: { getEquipment: equipment } },
      { provide: BatchApi, useValue: { getBatches: () => of([{ id: 1, labId, status: 'IN_PROGRESS' }]) } },
      { provide: CaApi, useValue: { getAlerts: alerts } },
      { provide: TrackingApi, useValue: { getLatestMeasurements: (id: number) => measurements.get(id) } },
      { provide: SubscriptionApi, useValue: { getCurrentSubscription: subscription,
        getPlans: () => of([{ code: 'BASIC', billingPeriod: 'YEARLY', name: 'Wrong cycle' },
          { code: 'BASIC', billingPeriod: 'MONTHLY', name: 'Standard' }]) } },
    ] });
    store = TestBed.inject(DashboardStore);
  });
  it('loads only owned equipment and includes acknowledged alerts from all equipment', () => {
    store.reload();
    expect(equipment).toHaveBeenCalledWith(labId);
    expect(alerts.mock.calls.map(call => call[0].equipmentId)).toEqual([4, 5]);
    expect(store.openAlerts().map(alert => alert.id)).toEqual([5, 4]);
    expect(store.lowStock()).toHaveLength(1);
    expect(store.currentPlan()?.name).toBe('Standard');
  });
  it('does not replace successful sections with an alert failure or report zero alerts', () => {
    alerts.mockImplementation(({ equipmentId }) => equipmentId === 5 ? throwError(() => new Error()) : of([]));
    store.reload();
    expect(store.alerts().status).toBe('error');
    expect(store.alerts().data).toBeNull();
    expect(store.subscription().status).toBe('ready');
    expect(store.batches().status).toBe('ready');
  });
  it('cancels late telemetry and refuses equipment outside this laboratory', () => {
    store.reload();
    store.selectEquipment(99);
    expect(store.selectedEquipmentId()).toBe(4);
    store.selectEquipment(5);
    measurements.get(4)!.next([{ equipmentId: 4, value: 90 } as Measurement]);
    expect(store.measurements().data).toBeNull();
    measurements.get(5)!.next([]);
    expect(store.measurements()).toEqual({ status: 'ready', data: [] });
  });
  it('keeps parameter and unit series separate and uses actual timestamps', () => {
    store.reload();
    const point = { equipmentId: 4, parameterName: 'Temperature', unit: 'C', timestamp: '2026-09-05T12:00:00Z' };
    measurements.get(4)!.next([{ ...point, value: 7 }, { ...point, value: 6, timestamp: '2026-09-05T11:00:00Z' },
      { ...point, value: 44, unit: 'F' }, { ...point, value: 65, parameterName: 'Humidity', unit: '%' },
      { ...point, value: 999, equipmentId: 99 }, { ...point, value: NaN }] as Measurement[]);
    expect(store.series()).toHaveLength(3);
    expect(store.readings().map(point => point.value)).toEqual([6, 7]);
    expect(store.readingRange()).toEqual({ min: 6, max: 7 });
    expect(store.latestReading()?.timestamp).toBe(point.timestamp);
  });
  it('treats absent subscription differently from a service failure', () => {
    subscription.mockReturnValue(throwError(() => new Error('Resource not found')));
    store.reload();
    expect(store.subscription()).toEqual({ status: 'ready', data: null });
    subscription.mockReturnValue(throwError(() => new Error('Forbidden')));
    store.loadSubscription();
    expect(store.subscription()).toEqual({ status: 'error', data: null });
  });
  it('clears equipment selection and readings when refreshed inventory becomes empty', () => {
    store.reload();
    equipment.mockReturnValue(of([]));
    store.reload();
    expect(store.selectedEquipmentId()).toBeNull();
    expect(store.activeSeries()).toBeNull();
    expect(store.alerts()).toEqual({ status: 'ready', data: [] });
  });
});
