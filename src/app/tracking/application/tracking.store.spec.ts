import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TrackingStore } from './tracking.store';
import { TrackingApi } from '../infrastructure/tracking-api';
import { Measurement } from '../domain/model/measurement.entity';
import { EquipmentStatus } from '../domain/model/equipment-status.entity';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';

describe('TrackingStore real-data states', () => {
  let store: TrackingStore;
  let first: Subject<Measurement[]>;
  let second: Subject<Measurement[]>;
  let status: Subject<EquipmentStatus | null>;
  let history: Subject<TelemetryHistoryPoint[]>;
  beforeEach(() => {
    first = new Subject(); second = new Subject(); status = new Subject();
    history = new Subject();
    TestBed.configureTestingModule({ providers: [{ provide: TrackingApi, useValue: {
      getLatestMeasurements: (id: number) => id === 23 ? first : second,
      getEquipmentStatus: () => status,
      getTelemetryHistory: () => history,
    } }] });
    store = TestBed.inject(TrackingStore);
  });
  it('does not report offline before any status is recorded', () => {
    expect(store.currentEquipmentStatus()).toBeNull();
    expect(store.equipmentTelemetryStatus()).toBe('UNKNOWN');
  });
  it('never mixes different parameters into a single chart series', () => {
    store.loadTelemetryHistory({ equipmentId: 23 });
    history.next([
      { parameterName: 'Temperature', recordedValue: 24, timestamp: '2026-09-01T12:00:00Z' },
      { parameterName: 'Humidity', recordedValue: 60, timestamp: '2026-09-01T12:00:00Z' },
      { parameterName: 'Temperature', recordedValue: 22, timestamp: '2026-09-01T11:00:00Z' },
    ] as TelemetryHistoryPoint[]);
    history.complete();
    expect(store.historyParameters()).toEqual(['Temperature', 'Humidity']);
    expect(store.selectedHistory().map(point => point.recordedValue)).toEqual([22, 24]);
    store.historyParameter.set('Humidity');
    expect(store.selectedHistory().map(point => point.recordedValue)).toEqual([60]);
    store.loadTelemetryHistory({ equipmentId: 24 });
    expect(store.selectedHistory()).toEqual([]);
  });
  it('waits for every active dashboard request', () => {
    store.loadLatestMeasurements(23); store.loadEquipmentStatus(23);
    first.next([]); first.complete();
    expect(store.isLoading()).toBe(true);
    status.next(null); status.complete();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });
  it('ignores an older equipment response after selection changes', () => {
    store.loadLatestMeasurements(23); store.loadLatestMeasurements(24);
    first.next([{ id: 8, equipmentId: 23 } as Measurement]);
    expect(store.measurements()).toEqual([]);
    second.next([{ id: 9, equipmentId: 24 } as Measurement]); second.complete();
    expect(store.measurements()[0].equipmentId).toBe(24);
  });
  it('distinguishes errors from empty successful readings', () => {
    store.loadLatestMeasurements(23);
    first.error(new Error('Test network failure'));
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('onboarding.load-error');
    expect(store.measurements()).toEqual([]);
  });
});
