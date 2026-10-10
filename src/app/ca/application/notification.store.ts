import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';

import { Notification } from '../domain/model/notification.entity';
import { CaApi } from '../infrastructure/ca-api';
import { IamStore } from '../../iam/application/iam.store';

/** Notifications shown when the bell opens. */
const PANEL_SIZE = 15;

/**
 * Application store of the notifications of the signed-in user (US83): the unread count of the bell in the toolbar
 * and the latest notifications of its panel.
 *
 * @remarks
 * Provided in root so that the toolbar keeps the count while the person moves between views. Everything is cleared
 * when another person signs in.
 *
 * @example
 * ```typescript
 * const store = inject(NotificationStore);
 *
 * store.refreshUnreadCount().subscribe();
 * store.loadLatest();
 * console.log(store.hasUnread()); // true while the bell has something to show
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly caApi = inject(CaApi);
  private readonly iam = inject(IamStore);

  private readonly unreadCountSignal = signal(0);
  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal(false);

  /** Notifications the person has not read. */
  readonly unreadCount = this.unreadCountSignal.asReadonly();

  /** Latest notifications, newest first. */
  readonly notifications = this.notificationsSignal.asReadonly();

  /** Whether the latest notifications are being loaded. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Whether the latest notifications could not be loaded. */
  readonly failed = this.errorSignal.asReadonly();

  /** Whether the person has at least one unread notification. */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /**
   * Creates the store.
   *
   * @remarks
   * An effect watches the signed-in user and empties the count and the notifications whenever it changes, so that
   * nothing of a previous person is shown to the next one.
   */
  constructor() {
    effect(() => {
      this.iam.currentUserId();
      this.unreadCountSignal.set(0);
      this.notificationsSignal.set([]);
    });
  }

  /**
   * Updates the count of the bell; a failure keeps the last count.
   *
   * @returns Observable emitting the new unread count, or the last known one if the request failed. It never errors.
   */
  refreshUnreadCount(): Observable<number> {
    return this.caApi.getUnreadNotificationCount().pipe(
      tap((count) => this.unreadCountSignal.set(count)),
      catchError(() => of(this.unreadCountSignal())),
    );
  }

  /**
   * Loads the latest notifications for the panel of the bell.
   *
   * @remarks
   * Fetches up to {@link PANEL_SIZE} notifications, read or not, and refreshes the unread count afterwards. If the
   * request fails, {@link NotificationStore.failed} turns `true` and the previous notifications are kept.
   */
  loadLatest(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(false);
    this.caApi.getNotifications(false, PANEL_SIZE).pipe(
      finalize(() => this.loadingSignal.set(false)),
    ).subscribe({
      next: (notifications) => {
        this.notificationsSignal.set(notifications);
        this.refreshUnreadCount().subscribe();
      },
      error: () => this.errorSignal.set(true),
    });
  }

  /**
   * Marks a notification as read when the person opens it.
   *
   * @param notification - The notification the person opened; nothing happens if it is already read
   *
   * @remarks
   * Once the platform confirms, the notification is replaced in the panel and the unread count goes down by one
   * (never below zero). A failure changes nothing.
   */
  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    this.caApi.markNotificationAsRead(notification.id).subscribe({
      next: (read) => {
        this.notificationsSignal.update((current) => current.map((item) => item.id === read.id ? read : item));
        this.unreadCountSignal.update((count) => Math.max(0, count - 1));
      },
    });
  }

  /**
   * Marks every notification of the person as read.
   *
   * @remarks
   * Once the platform confirms, the notifications of the panel are marked with the current time of the browser and
   * the unread count goes to zero. A failure changes nothing.
   */
  markAllAsRead(): void {
    this.caApi.markAllNotificationsAsRead().subscribe({
      next: () => {
        const readAt = new Date().toISOString();
        this.notificationsSignal.update((current) => current.map((item) =>
          item.isRead ? item : new Notification({ ...item, readAt })));
        this.unreadCountSignal.set(0);
      },
    });
  }
}
