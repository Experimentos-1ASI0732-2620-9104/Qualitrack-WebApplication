import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { AlertSeverity, AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertDetailResource, AlertResource, AlertsResponse } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { ResolveAlertRequest } from './resolve-alert.request';
import { AlertEmailNotificationResource } from './notification-response';

const apiBaseUrl = environment.serverBasePath;

/** Filters of the alerts of an environment (TS74). */
export interface AlertFilters {
  /** Only alerts in this step of the life cycle. */
  status?: AlertStatus;
  /** Only alerts of this severity. */
  severity?: AlertSeverity;
  /** Only alerts detected by this device or equipment. */
  deviceId?: number;
  /** Only open alerts: unresolved or being attended (US85). */
  active?: boolean;
}

/**
 * HTTP client of deviation alerts: listed per environment under
 * /laboratories/{laboratoryId}/environments/{environmentId}/deviation-alerts (TS74) and attended through
 * /deviation-alerts/{alertId} (TS75, TS76).
 *
 * @remarks
 * Every method fails with an `ApiError` that keeps the HTTP status and the details sent by the server.
 */
export class AlertApiEndpoint extends BaseApiEndpoint<
  DeviationAlert,
  AlertResource,
  AlertsResponse,
  AlertAssembler
> {
  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(http: HttpClient) {
    super(http, `${apiBaseUrl}${environment.deviationAlertsEndpointPath}`, new AlertAssembler());
  }

  /**
   * Retrieves the alerts of an environment and its monitored containers (TS74).
   *
   * @param laboratoryId - The laboratory of the environment
   * @param environmentId - The environment
   * @param filters - Optional filters; only those that are set are sent as query parameters
   * @returns Observable emitting the alerts of the environment
   */
  getEnvironmentAlerts(laboratoryId: number, environmentId: number, filters: AlertFilters = {}): Observable<DeviationAlert[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.deviceId) params = params.set('deviceId', filters.deviceId);
    if (filters.active) params = params.set('active', true);
    const url = `${apiBaseUrl}${environment.laboratoryLabsEndpointPath}/${laboratoryId}`
      + `${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.deviationAlertsEndpointPath}`;
    return this.http.get<AlertResource[]>(url, { params }).pipe(
      map((resources) => this.assembler.toEntitiesFromResources(resources)),
      catchError(this.handleError('Failed to fetch deviation alerts')),
    );
  }

  /**
   * Retrieves an alert with its origin and the actions related to the incident (US86).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns Observable emitting the alert, with its related actuations
   */
  getAlertById(alertId: number): Observable<DeviationAlert> {
    return this.http.get<AlertDetailResource>(`${this.endpointUrl}/${alertId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch deviation alert ${alertId}`)),
    );
  }

  /**
   * Registers that the authenticated user attends the alert (TS75).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns Observable emitting the updated alert, without the related actuations of the detail
   */
  acknowledgeAlert(alertId: number): Observable<DeviationAlert> {
    return this.http
      .post<AlertResource>(`${this.endpointUrl}/${alertId}${environment.deviationAlertAcknowledgementsEndpointPath}`, null)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to acknowledge deviation alert ${alertId}`)),
      );
  }

  /**
   * E-mails an open critical alert again to the people of the laboratory who enabled e-mail notices (TS78).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @returns How many people it was sent to and how many e-mails the provider accepted
   */
  sendEmailNotification(alertId: number): Observable<AlertEmailNotificationResource> {
    return this.http
      .post<AlertEmailNotificationResource>(
        `${this.endpointUrl}/${alertId}${environment.deviationAlertEmailNotificationsEndpointPath}`, null)
      .pipe(catchError(this.handleError(`Failed to e-mail deviation alert ${alertId}`)));
  }

  /**
   * Registers the resolution of the alert by the authenticated user (TS76).
   *
   * @param alertId - The unique numeric identifier of the deviation alert
   * @param request - DTO containing the resolution notes
   * @returns Observable emitting the updated alert, without the related actuations of the detail
   */
  resolveAlert(alertId: number, request: ResolveAlertRequest): Observable<DeviationAlert> {
    return this.http
      .post<AlertResource>(`${this.endpointUrl}/${alertId}${environment.deviationAlertResolutionsEndpointPath}`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to resolve deviation alert ${alertId}`)),
      );
  }
}
