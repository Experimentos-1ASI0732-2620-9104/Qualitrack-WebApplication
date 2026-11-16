import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { OverviewLaboratory } from '../domain/model/overview-laboratory.entity';
import { OverviewEnvironment } from '../domain/model/overview-environment.entity';
import { OverviewRawMaterial } from '../domain/model/overview-raw-material.entity';
import { OverviewBatch } from '../domain/model/overview-batch.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { OverviewAlert } from '../domain/model/overview-alert.entity';
import { OverviewReading } from '../domain/model/overview-reading.entity';
import { OverviewSubscription } from '../domain/model/overview-subscription.entity';
import { OverviewPlan } from '../domain/model/overview-plan.entity';
import { IndicatorPeriod } from '../domain/model/indicator-period';
import {
  OverviewAlertResource,
  OverviewBatchResource,
  OverviewEnvironmentalProfileResource,
  OverviewEnvironmentResource,
  OverviewEquipmentResource,
  OverviewLaboratoryResource,
  OverviewMeasurementResource,
  OverviewPlanResource,
  OverviewRawMaterialResource,
  OverviewSubscriptionResource,
} from './operational-overview-response';
import { OperationalOverviewAssembler } from './operational-overview-assembler';
import { OverviewEnvironmentalProfile } from '../domain/model/overview-environmental-profile.entity';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const plansEndpointUrl = `${environment.serverBasePath}${environment.subscriptionPlansEndpointPath}`;

/**
 * HTTP client of the operational overview (dashboard) of Reporting & Audit.
 *
 * @remarks
 * Reads the REST resources of the contexts that the overview summarizes and translates them with
 * {@link OperationalOverviewAssembler}, so Reporting & Audit does not depend on the code of those contexts:
 * - GET /laboratories/{laboratoryId} and /laboratories/{laboratoryId}/environments (Laboratory)
 * - GET .../environments/{environmentId}/raw-materials?stockStatus=LOW (Inventory)
 * - GET /laboratories/{laboratoryId}/batches (Product Batch)
 * - GET /laboratories/{laboratoryId}/equipments (Equipment)
 * - GET .../environments/{environmentId}/deviation-alerts?active=true (Compliance & Alerting)
 * - GET .../environments/{environmentId}[/container-monitors/{deviceId}]/telemetry-measurements (Tracking)
 * - GET /laboratories/{laboratoryId}/subscriptions?status=ACTIVE and /subscription-plans (Payments & Subscriptions)
 */
export class OperationalOverviewApiEndpoint extends ErrorHandlingEnabledBaseType {
  /** Assembler used to map raw API resources to domain entities. */
  private readonly assembler = new OperationalOverviewAssembler();

  /**
   * Creates an instance of OperationalOverviewApiEndpoint.
   *
   * @param http - Angular HttpClient used to perform the HTTP requests.
   */
  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the main data of a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns Observable stream emitting the {@link OverviewLaboratory} entity.
   */
  getLaboratory(laboratoryId: number): Observable<OverviewLaboratory> {
    return this.http.get<OverviewLaboratoryResource>(this.laboratory(laboratoryId)).pipe(
      map((resource) => this.assembler.toLaboratory(resource)),
      catchError(this.handleError(`Failed to fetch laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Reads the environments registered in a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns Observable stream emitting an array of {@link OverviewEnvironment} entities.
   */
  getEnvironments(laboratoryId: number): Observable<OverviewEnvironment[]> {
    return this.http
      .get<OverviewEnvironmentResource[]>(`${this.laboratory(laboratoryId)}${environment.laboratoryEnvironmentsEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEnvironment(resource))),
        catchError(this.handleError(`Failed to fetch environments of laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Reads the raw materials of an environment that have low stock.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @returns Observable stream emitting an array of {@link OverviewRawMaterial} entities.
   */
  getLowStockMaterials(laboratoryId: number, environmentId: number): Observable<OverviewRawMaterial[]> {
    const params = new HttpParams().set('stockStatus', 'LOW');
    return this.http
      .get<OverviewRawMaterialResource[]>(
        `${this.environment(laboratoryId, environmentId)}${environment.inventoryRawMaterialsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toRawMaterial(resource))),
        catchError(this.handleError(`Failed to fetch raw materials of environment ${environmentId}`)),
      );
  }

  /**
   * Reads the production batches of a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns Observable stream emitting an array of {@link OverviewBatch} entities.
   */
  getBatches(laboratoryId: number): Observable<OverviewBatch[]> {
    return this.http
      .get<OverviewBatchResource[]>(`${this.laboratory(laboratoryId)}${environment.productBatchesEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toBatch(resource))),
        catchError(this.handleError(`Failed to fetch batches of laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Reads the equipment and IoT devices of a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns Observable stream emitting an array of {@link OverviewEquipment} entities.
   */
  getEquipment(laboratoryId: number): Observable<OverviewEquipment[]> {
    return this.http
      .get<OverviewEquipmentResource[]>(`${this.laboratory(laboratoryId)}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEquipment(resource))),
        catchError(this.handleError(`Failed to fetch equipment of laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Reads the open alerts of a specific environment.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @returns Observable stream emitting an array of {@link OverviewAlert} entities.
   */
  getOpenAlerts(laboratoryId: number, environmentId: number): Observable<OverviewAlert[]> {
    const params = new HttpParams().set('active', true);
    return this.http
      .get<OverviewAlertResource[]>(
        `${this.environment(laboratoryId, environmentId)}${environment.deviationAlertsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toAlert(resource))),
        catchError(this.handleError(`Failed to fetch alerts of environment ${environmentId}`)),
      );
  }

  /**
   * Reads the measurements of an environment, or of one container monitor when its identifier is given.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @param containerMonitorId - Optional container monitor identifier.
   * @param period - The time period for the readings.
   * @returns Observable stream emitting an array of {@link OverviewReading} entities.
   */
  getReadings(
    laboratoryId: number,
    environmentId: number,
    containerMonitorId: number | null,
    period: IndicatorPeriod,
  ): Observable<OverviewReading[]> {
    const target = containerMonitorId === null
      ? this.environment(laboratoryId, environmentId)
      : `${this.environment(laboratoryId, environmentId)}${environment.containerMonitorsEndpointPath}/${containerMonitorId}`;
    const params = new HttpParams().set('from', period.from).set('to', period.to);
    return this.http
      .get<OverviewMeasurementResource[]>(`${target}${environment.trackingTelemetryMeasurementsEndpointPath}`, { params })
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toReading(resource))),
        catchError(this.handleError(`Failed to fetch measurements of environment ${environmentId}`)),
      );
  }

  /**
   * Reads the active subscription of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns Observable stream emitting the active subscription, or null when the laboratory has none.
   */
  getActiveSubscription(laboratoryId: number): Observable<OverviewSubscription | null> {
    const params = new HttpParams().set('status', 'ACTIVE');
    return this.http
      .get<OverviewSubscriptionResource[]>(
        `${this.laboratory(laboratoryId)}${environment.laboratorySubscriptionsEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => {
          const active = resources.find((resource) => resource.status === 'ACTIVE');
          return active ? this.assembler.toSubscription(active) : null;
        }),
        catchError(this.handleError(`Failed to fetch subscription of laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Reads all the available subscription plans in the platform.
   *
   * @returns Observable stream emitting an array of {@link OverviewPlan} entities.
   */
  getPlans(): Observable<OverviewPlan[]> {
    return this.http.get<OverviewPlanResource[]>(plansEndpointUrl).pipe(
      map((resources) => resources.map((resource) => this.assembler.toPlan(resource))),
      catchError(this.handleError('Failed to fetch subscription plans')),
    );
  }

  /**
   * Reads the environmental profile (thresholds) of an environment.
   *
   * @remarks
   * Tracking already exposes it; RA only consumes it to color the KPI cards.
   * A 404 means "not configured yet" and resolves to null.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @returns Observable stream emitting the profile or null.
   */
  getEnvironmentalProfile(
    laboratoryId: number,
    environmentId: number,
  ): Observable<OverviewEnvironmentalProfile | null> {
    const url = `${this.environment(laboratoryId, environmentId)}${environment.trackingEnvironmentalProfileEndpointPath}`;
    return this.http
      .get<OverviewEnvironmentalProfileResource>(url)
      .pipe(
        map((resource) => this.assembler.toEnvironmentalProfile(resource)),
        catchError((error: HttpErrorResponse) =>
          error.status === 404
            ? of(null)
            : this.handleError(`Failed to fetch environmental profile of environment ${environmentId}`)(error),
        ),
      );
  }

  /**
   * Reads the environmental profile (thresholds) of a specific container monitor.
   *
   * @remarks
   * Container monitors have their own thresholds independent of the environment.
   * A 404 means "not configured yet" and resolves to null.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @param deviceId - The container monitor identifier.
   * @returns Observable stream emitting the profile or null.
   */
  getContainerMonitorProfile(
    laboratoryId: number,
    environmentId: number,
    deviceId: number,
  ): Observable<OverviewEnvironmentalProfile | null> {
    const url = `${this.environment(laboratoryId, environmentId)}${environment.containerMonitorsEndpointPath}/${deviceId}${environment.trackingEnvironmentalProfileEndpointPath}`;
    return this.http
      .get<OverviewEnvironmentalProfileResource>(url)
      .pipe(
        map((resource) => this.assembler.toEnvironmentalProfile(resource)),
        catchError((error: HttpErrorResponse) =>
          error.status === 404
            ? of(null)
            : this.handleError(`Failed to fetch container monitor profile`)(error),
        ),
      );
  }

  /**
   * Builds the base URL for a specific laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @returns The absolute URL path to the laboratory.
   */
  private laboratory(laboratoryId: number): string {
    return `${laboratoriesEndpointUrl}/${laboratoryId}`;
  }

  /**
   * Builds the base URL for a specific environment within a laboratory.
   *
   * @param laboratoryId - The laboratory identifier.
   * @param environmentId - The environment identifier.
   * @returns The absolute URL path to the environment.
   */
  private environment(laboratoryId: number, environmentId: number): string {
    return `${this.laboratory(laboratoryId)}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }
}
