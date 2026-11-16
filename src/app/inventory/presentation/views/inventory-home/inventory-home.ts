import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import { IamStore } from '../../../../iam/application/iam.store';

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
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './inventory-home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-home.css',
})
export class InventoryHome implements OnInit {
  protected readonly store = inject(InventoryStore);
  protected readonly iam = inject(IamStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  async ngOnInit(): Promise<void> {
    await this.store.loadEnvironments();
    // Whoever left while the environments were loading stays where they went.
    if (this.destroyRef.destroyed) return;
    const environment = this.store.preferredEnvironment();
    if (environment) {
      await this.router.navigate(['/inventory/environments', environment.id, 'raw-materials'], {
        replaceUrl: true,
      });
    }
  }
}
