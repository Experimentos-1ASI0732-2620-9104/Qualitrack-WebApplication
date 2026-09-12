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

const usersEndpointUrl = `${environment.serverBasePath}${environment.usersEndpointPath}`;

/**
 * HTTP endpoint client for notification preference operations.
 */
export class NotificationPreferenceApiEndpoint extends BaseApiEndpoint<
  NotificationPreference,
  NotificationPreferenceResource,
  NotificationPreferencesResponse,
  NotificationPreferenceAssembler
> {
  constructor(http: HttpClient) {
    super(http, usersEndpointUrl, new NotificationPreferenceAssembler());
  }

  getPreferences(userId: number): Observable<NotificationPreference> {
    return this.http
      .get<NotificationPreferenceResource>(
        `${this.endpointUrl}/${userId}${environment.caNotificationPrefsEndpointPath}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch notification preferences for user ${userId}`)),
      );
  }

  updatePreferences(
    userId: number,
    request: UpdateNotificationPreferenceRequest,
  ): Observable<NotificationPreference> {
    return this.http
      .put<NotificationPreferenceResource>(
        `${this.endpointUrl}/${userId}${environment.caNotificationPrefsEndpointPath}`,
        request,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(
          this.handleError(`Failed to update notification preferences for user ${userId}`),
        ),
      );
  }
}
