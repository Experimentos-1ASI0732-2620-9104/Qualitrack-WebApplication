import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';

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
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <main class="operations-page">
      <header class="page-heading">
        <h1>
          <mat-icon aria-hidden="true">factory</mat-icon>{{ 'product-catalog.title' | translate }}
        </h1>
        <a mat-stroked-button routerLink="/batches">
          <mat-icon>list_alt</mat-icon>{{ 'batches.title' | translate }}
        </a>
      </header>
      @if (store.environmentsLoading()) {
        <p role="status">{{ 'common.status-loading' | translate }}</p>
      } @else if (store.environmentsError(); as error) {
        <p class="error" role="alert">{{ error | translate }}</p>
      } @else if (store.environmentsEmpty()) {
        <section class="editor" role="status">
          <h2>{{ 'product-catalog.no-environments' | translate }}</h2>
          <p class="notice">{{ 'product-catalog.no-environments-notice' | translate }}</p>
          @if (store.canManageProducts()) {
            <a mat-flat-button routerLink="/laboratories/environments/new">
              <mat-icon>add_location_alt</mat-icon>{{ 'environments.register' | translate }}
            </a>
          }
        </section>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-home.css',
})
export class BatchHome implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Lifecycle hook that loads the environments and opens the products of the preferred one.
   */
  async ngOnInit(): Promise<void> {
    await this.store.loadEnvironments();
    // Whoever left while the environments were loading stays where they went.
    if (this.destroyRef.destroyed) return;
    const environment = this.store.preferredProductionEnvironment();
    if (environment) {
      await this.router.navigate(['/batches/environments', environment.id, 'products'], {
        replaceUrl: true,
      });
    }
  }
}
