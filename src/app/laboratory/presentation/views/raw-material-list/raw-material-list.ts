import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for displaying raw materials registered in a laboratory.
 *
 * @remarks
 * This presentation component loads raw material inventory for the current
 * laboratory and highlights low-stock materials based on their configured
 * minimum stock threshold.
 */
@Component({
  selector: 'app-raw-material-list',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './raw-material-list.html',
  styleUrl: './raw-material-list.css',
})
export class RawMaterialList implements OnInit {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate to raw material registration.
   */
  private readonly router = inject(Router);

  /**
   * Columns displayed in the raw material inventory table.
   */
  protected readonly displayedColumns = [
    'name',
    'code',
    'supplier',
    'stock',
    'expirationDate',
    'status',
  ];

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that loads raw materials for the current laboratory.
   */
  ngOnInit(): void {
    this.store.loadRawMaterials(this.currentLaboratoryId);
  }

  /**
   * Determines whether a raw material should be treated as low stock.
   *
   * @param quantity - Current stock quantity
   * @param minimum - Minimum stock threshold
   * @returns True when current quantity is less than or equal to the threshold
   */
  protected isLowStock(quantity: number, minimum: number): boolean {
    return quantity <= minimum;
  }

  /**
   * Navigates to the raw material registration form.
   */
  protected onAdd(): void {
    this.router.navigate(['/laboratories/raw-material-form']);
  }
}
