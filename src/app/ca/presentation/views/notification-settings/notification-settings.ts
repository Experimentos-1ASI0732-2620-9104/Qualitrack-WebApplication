import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NotificationPreferencesForm } from '../../components/notification-preferences-form/notification-preferences-form';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { alertTabs } from '../../alert-tabs';

/** Notification preferences owned by Compliance & Alerts and linked from the profile and toolbar bell. */
@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [NotificationPreferencesForm, PageHeader],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotificationSettings {
  /** Operations of the alerts module. */
  protected readonly tabs = alertTabs(null);
}
