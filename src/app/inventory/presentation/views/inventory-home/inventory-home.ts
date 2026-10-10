import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/**
 * Entry point of the inventory: opens the raw materials of the environment the user works with.
 *
 * @remarks
 * Raw materials are kept per environment (TS21). The default environment is the last one used,
 * otherwise the first raw material storage, otherwise the first environment of the laboratory.
 */
@Component({
  selector: 'app-inventory-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <main class="operations-page">
      <header class="page-heading">
        <h1><mat-icon aria-hidden="true">inventory_2</mat-icon>{{ 'inventory.title' | translate }}</h1>
      </header>
      @if (environments.isLoading()) {
        <p role="status">{{ 'inventory.loading' | translate }}</p>
      } @else if (environments.error()) {
        <p class="error" role="alert">{{ environments.error() }}</p>
      } @else if (environments.isEmpty()) {
        <section class="editor" role="status">
          <h2>{{ 'inventory.noEnvironments' | translate }}</h2>
          <p class="notice">{{ 'inventory.noEnvironmentsNotice' | translate }}</p>
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
export class InventoryHome implements OnInit {
  protected readonly environments = inject(EnvironmentStore);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.environments.loadEnvironments();
    const environment = this.environments.preferredEnvironment('RAW_MATERIAL_STORAGE');
    if (environment) {
      await this.router.navigate(['/inventory/environments', environment.id, 'raw-materials'], { replaceUrl: true });
    }
  }
}
