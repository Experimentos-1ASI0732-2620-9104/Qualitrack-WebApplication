import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import {
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
} from './notification-preference-response';
import { NotificationPreferenceAssembler } from './notification-preference-assembler';
import { UpdateNotificationPreferenceRequest } from './notification-preference.request';

const preferencesEndpointUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.caNotificationPrefsEndpointPath}`;

/**
 * HTTP endpoint client for the notification preferences of the signed-in user (/users/me/notification-preferences).
 *
 * @remarks
 * Every method fails with an `ApiError` that keeps the HTTP status and the details sent by the server.
 */
export class NotificationPreferenceApiEndpoint extends BaseApiEndpoint<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
  NotificationPreferenceAssembler
> {
  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(http: HttpClient) {
    super(http, preferencesEndpointUrl, new NotificationPreferenceAssembler());
  }

  /**
   * Retrieves the notification preferences of the signed-in user.
   *
   * @returns Observable emitting the preferences
   */
  getPreferences(): Observable<NotificationPreference> {
    return this.http.get<NotificationPreferenceResource>(this.endpointUrl).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch the notification preferences')),
    );
  }

  /**
   * Replaces the notification preferences of the signed-in user.
   *
   * @param request - DTO containing the new preference values
   * @returns Observable emitting the saved preferences
   */
  updatePreferences(request: UpdateNotificationPreferenceRequest): Observable<NotificationPreference> {
    return this.http.put<NotificationPreferenceResource>(this.endpointUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update the notification preferences')),
    );
  }
}
