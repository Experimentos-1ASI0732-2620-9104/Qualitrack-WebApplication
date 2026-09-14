import { DestroyRef, Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription as Request, catchError, from, map, mergeMap, of, throwError, toArray } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { LaboratoryApi } from '../../laboratory/infrastructure/laboratory-api';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { CaApi } from '../../ca/infrastructure/ca-api';
import { TrackingApi } from '../../tracking/infrastructure/tracking-api';
import { SubscriptionApi } from '../../subscription/infrastructure/subscription-api';
import { Laboratory } from '../../laboratory/domain/model/laboratory.entity';
import { InventoryMaterial } from '../../inventory/domain/model/inventory-catalogue';
import { InventoryApi } from '../../inventory/infrastructure/inventory-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';
import { Batch } from '../../batch/domain/model/batch.entity';
import { DeviationAlert } from '../../ca/domain/model/deviation-alert.entity';
import { Measurement } from '../../tracking/domain/model/measurement.entity';
import { Subscription } from '../../subscription/domain/model/subscription.entity';
import { SubscriptionPlan } from '../../subscription/domain/model/subscription-plan.entity';

type LoadState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; data: T | null };
const resource = <T>() => signal<LoadState<T>>({ status: 'idle', data: null });

/** View-scoped composition; module stores and other laboratories are not reused. */
@Injectable()
export class DashboardStore {
  private readonly iam = inject(IamStore);
  private readonly labApi = inject(LaboratoryApi);
  private readonly inventoryApi = inject(InventoryApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly batchApi = inject(BatchApi);
  private readonly caApi = inject(CaApi);
  private readonly trackingApi = inject(TrackingApi);
  private readonly subscriptionApi = inject(SubscriptionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new Map<unknown, Request>();
  readonly laboratory = resource<Laboratory>();
  readonly equipment = resource<Equipment[]>();
  readonly batches = resource<Batch[]>();
  readonly materials = resource<InventoryMaterial[]>();
  readonly alerts = resource<DeviationAlert[]>();
  readonly measurements = resource<Measurement[]>();
  readonly subscription = resource<Subscription | null>();
  readonly plans = resource<SubscriptionPlan[]>();
  readonly selectedEquipmentId = signal<number | null>(null);
  readonly selectedSeriesKey = signal('');
  readonly isLoading = computed(() => [this.laboratory(), this.equipment(), this.batches(),
    this.materials(), this.alerts(), this.measurements(), this.subscription(), this.plans()]
    .some(state => state.status === 'loading'));
  readonly openAlerts = computed(() => (this.alerts().data ?? []).filter(alert => alert.status !== 'RESOLVED')
    .sort((a, b) => Number(b.severity === 'CRITICAL') - Number(a.severity === 'CRITICAL')
      || Date.parse(b.timestamp) - Date.parse(a.timestamp)));
  readonly lowStock = computed(() => (this.materials().data ?? [])
    .filter(material => material.usableStock < material.minimumStock));
  readonly currentPlan = computed(() => {
    const sub = this.subscription().data;
    return this.plans().data?.find(plan => plan.code === sub?.planCode && plan.billingPeriod === sub.billingCycle) ?? null;
  });
  readonly series = computed(() => {
    const series = new Map<string, { key: string; parameter: string; unit: string }>();
    for (const point of this.measurements().data ?? []) {
      const key = JSON.stringify([point.parameterName, point.unit]);
      series.set(key, { key, parameter: point.parameterName, unit: point.unit });
    }
    return [...series.values()];
  });
  readonly activeSeries = computed<{ key: string; parameter: string; unit: string } | null>(() => this.series().find(item => item.key === this.selectedSeriesKey())
    ?? this.series()[0] ?? null);
  readonly readings = computed(() => (this.measurements().data ?? [])
    .filter(point => point.parameterName === this.activeSeries()?.parameter && point.unit === this.activeSeries()?.unit)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)).slice(-48));
  readonly latestReading = computed(() => this.readings().at(-1) ?? null);
  readonly readingRange = computed(() => {
    const values = this.readings().map(point => point.value);
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : null;
  });

  reload(): void {
    const preferredEquipment = this.selectedEquipmentId();
    const id = this.iam.requireLaboratoryId();
    this.requests.forEach(request => request.unsubscribe());
    this.requests.clear();
    this.selectedEquipmentId.set(null);
    this.measurements.set({ status: 'idle', data: null });
    this.alerts.set({ status: 'loading', data: null });
    this.load(this.laboratory, this.labApi.getLaboratory(id));
    this.load(this.materials, this.inventoryApi.materials(id).pipe(map(items => items.filter(item => item.laboratoryId === id))));
    this.load(this.batches, this.batchApi.getBatches(id).pipe(map(items => items.filter(item => item.labId === id))));
    this.load(this.equipment, this.equipmentApi.getEquipment(id).pipe(map(items => items.filter(item => item.labId === id))), items => {
      this.selectEquipment(items.find(item => item.id === preferredEquipment)?.id ?? items[0]?.id ?? null);
      this.loadAlerts();
    }, () => this.alerts.set({ status: 'error', data: null }));
    this.loadSubscription();
    this.loadPlans();
  }
  loadSubscription(): void {
    const id = this.iam.requireLaboratoryId();
    this.load(this.subscription, this.subscriptionApi.getCurrentSubscription(id).pipe(
      map(value => { if (value.laboratoryId !== id) throw new Error('Unexpected laboratory'); return value; }),
      catchError(error => error instanceof Error && error.message.includes('Resource not found')
        ? of(null) : throwError(() => error))));
  }
  loadPlans(): void { this.load(this.plans, this.subscriptionApi.getPlans()); }
  loadAlerts(): void {
    if (this.equipment().status !== 'ready') return;
    // An incomplete equipment load must not be presented as zero laboratory alerts.
    this.load(this.alerts, from(this.equipment().data ?? []).pipe(
      mergeMap(item => this.caApi.getAlerts({ equipmentId: item.id }).pipe(
        map(alerts => alerts.filter(alert => alert.equipmentId === item.id))), 4),
      toArray(), map(groups => [...new Map(groups.flat().map(alert => [alert.id, alert])).values()])));
  }
  selectEquipment(id: number | null): void {
    if (id !== null && !this.equipment().data?.some(item => item.id === id)) return;
    this.requests.get(this.measurements)?.unsubscribe();
    this.selectedEquipmentId.set(id);
    this.measurements.set({ status: 'idle', data: null });
    if (id !== null) this.load(this.measurements, this.trackingApi.getLatestMeasurements(id).pipe(
      map(points => points.filter(point => point.equipmentId === id && Number.isFinite(point.value)
        && Number.isFinite(Date.parse(point.timestamp))))));
  }
  equipmentName(id: number): string { return this.equipment().data?.find(item => item.id === id)?.name ?? String(id); }
  private load<T>(target: WritableSignal<LoadState<T>>, source: Observable<T>,
    after?: (data: T) => void, failed?: () => void): void {
    this.requests.get(target)?.unsubscribe();
    target.set({ status: 'loading', data: null });
    this.requests.set(target, source.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { target.set({ status: 'ready', data }); after?.(data); },
      error: () => { target.set({ status: 'error', data: null }); failed?.(); },
    }));
  }
}
