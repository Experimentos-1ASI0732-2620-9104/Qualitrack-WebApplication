import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';

import { IamStore } from './iam/application/iam.store';
import { Layout } from './shared/presentation/components/layout/layout';
import { NotificationBell } from './ca/presentation/components/notification-bell/notification-bell';
import { UserProfileBadge } from './profile/presentation/components/user-profile-badge/user-profile-badge';
import { UserSessionSection } from './iam/presentation/components/user-session-section/user-session-section';

/**
 * Root component of the application.
 *
 * @remarks
 * This component acts as the **Composition Root** (the "glue").
 * Since it lives outside the `shared` bounded context, it is allowed to import
 * dependencies from `iam`, `profile`, and `ca`.
 *
 * Its main responsibility here is to inject the `IamStore` and project the
 * cross-context components into the `Layout`'s `<ng-content>` slots,
 * keeping `shared` completely decoupled.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Layout,
    NotificationBell,
    UserProfileBadge,
    UserSessionSection,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('QualiTrack | IoTech');
  private translate = inject(TranslateService);

  /** Injected to provide UI state to the Layout and its projected components. */
  protected readonly iam = inject(IamStore);

  constructor() {
    this.translate.addLangs(['en', 'es']);
    this.translate.use('en');
    document.documentElement.lang = 'en';
  }
}
