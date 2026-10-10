import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Notification } from '../domain/model/notification.entity';
import {
  NotificationResource,
  NotificationsReadResource,
  NotificationsResponse,
  UnreadNotificationsResource,
} from './notification-response';
import { NotificationAssembler } from './notification-assembler';

const notificationsEndpointUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.caNotificationsEndpointPath}`;

/**
 * HTTP endpoint client for the notifications of the signed-in user (/users/me/notifications).
 *
 * @remarks
 * Every method fails with an `ApiError` that keeps the HTTP status and the details sent by the server.
 */
export class NotificationApiEndpoint extends BaseApiEndpoint<
  Notification,
  NotificationResource,
  NotificationsResponse,
  NotificationAssembler
> {
  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(http: HttpClient) {
    super(http, notificationsEndpointUrl, new NotificationAssembler());
  }

  /**
   * Retrieves the notifications of the signed-in user, newest first.
   *
   * @param unreadOnly - Leaves out the notifications already read
   * @param limit - Maximum number of notifications (1 to 100)
   * @returns Observable emitting the notifications
   */
  getNotifications(unreadOnly: boolean, limit: number): Observable<Notification[]> {
    const params = new HttpParams().set('unread', unreadOnly).set('limit', limit);
    return this.http.get<NotificationResource[]>(this.endpointUrl, { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch notifications')),
    );
  }

  /**
   * Retrieves how many notifications the signed-in user has not read.
   *
   * @returns Observable emitting the unread count
   */
  getUnreadCount(): Observable<number> {
    return this.http
      .get<UnreadNotificationsResource>(`${this.endpointUrl}${environment.caNotificationUnreadCountEndpointPath}`)
      .pipe(
        map((resource) => resource.unreadCount),
        catchError(this.handleError('Failed to count unread notifications')),
      );
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - The unique numeric identifier of the notification
   * @returns Observable emitting the notification, now read
   */
  markAsRead(notificationId: number): Observable<Notification> {
    return this.http
      .post<NotificationResource>(
        `${this.endpointUrl}/${notificationId}${environment.caNotificationReadReceiptsEndpointPath}`,
        null,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to mark notification ${notificationId} as read`)),
      );
  }

  /**
   * Marks every notification of the signed-in user as read.
   *
   * @returns Observable emitting how many notifications were unread
   */
  markAllAsRead(): Observable<number> {
    return this.http
      .post<NotificationsReadResource>(`${this.endpointUrl}${environment.caNotificationReadReceiptsEndpointPath}`, null)
      .pipe(
        map((resource) => resource.markedAsRead),
        catchError(this.handleError('Failed to mark the notifications as read')),
      );
  }
}
