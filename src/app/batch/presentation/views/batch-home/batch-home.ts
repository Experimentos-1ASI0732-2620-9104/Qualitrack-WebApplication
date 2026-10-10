import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  Router,
  RouterLink
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/**
 * Entry point of Product Batch Management: opens the products of the environment the user works with.
 *
 * @remarks
 * Products are registered per environment. The default environment is the last one used for
 * production, otherwise the first production environment, otherwise the first environment. While the
 * environments load, or when there is none, the view shows a status message instead.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-home',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <main class="operations-page">
      <header class="page-heading">
        <h1>
          <mat-icon aria-hidden="true">factory</mat-icon>{{ 'product-catalog.title' | translate }}
        </h1>
        <a mat-stroked-button routerLink="/batches/batch-list">
          <mat-icon>list_alt</mat-icon>{{ 'batches.title' | translate }}
        </a>
      </header>
      @if (environments.isLoading()) {
        <p role="status">{{ 'common.status-loading' | translate }}</p>
      } @else if (environments.error()) {
        <p class="error" role="alert">{{ environments.error() }}</p>
      } @else if (environments.isEmpty()) {
        <section class="editor" role="status">
          <h2>{{ 'product-catalog.no-environments' | translate }}</h2>
          <p class="notice">{{ 'product-catalog.no-environments-notice' | translate }}</p>
          @if (environments.canManage()) {
            <a mat-flat-button routerLink="/laboratories/environments/new">
              <mat-icon>add_location_alt</mat-icon>{{ 'environments.register' | translate }}
            </a>
          }
        </section>
      }
    </main>
  `,
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})

export class BatchHome implements OnInit {
  protected readonly environments = inject(EnvironmentStore);
  private readonly router = inject(Router);

  /**
   * Lifecycle hook that loads the environments and opens the products of the preferred one.
   */
  async ngOnInit(): Promise<void> {
    await this.environments.loadEnvironments();
    const environment = this.environments.preferredEnvironment('PRODUCTION', 'production');
    if (environment) {
      await this.router.navigate(['/batches/environments', environment.id, 'products'], {
        replaceUrl: true,
      });
    }
  }
}
