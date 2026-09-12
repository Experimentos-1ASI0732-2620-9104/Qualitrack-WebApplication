import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { PharmaceuticalProduct } from '../../../domain/model/pharmaceutical-product.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for displaying the pharmaceutical product catalog.
 *
 * @remarks
 * This presentation component loads products associated with the current
 * laboratory and provides a local search filter by product name or catalog code.
 */
@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './product-catalog.html',
  styleUrl: './product-catalog.css',
})
export class ProductCatalog implements OnInit {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate to product registration.
   */
  private readonly router = inject(Router);

  /**
   * Search term used to filter products by name or code.
   */
  protected readonly searchTerm = signal<string>('');

  /**
   * Columns displayed in the product catalog table.
   */
  protected readonly displayedColumns = ['code', 'name', 'specifications', 'active'];

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that loads products for the current laboratory.
   */
  ngOnInit(): void {
    this.store.loadProducts(this.currentLaboratoryId);
  }

  /**
   * Filtered product list based on the current search term.
   */
  protected get filtered(): PharmaceuticalProduct[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.store.products();
    }

    return this.store
      .products()
      .filter(
        (product) =>
          product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term),
      );
  }

  /**
   * Navigates to the product registration form.
   */
  protected onAdd(): void {
    this.router.navigate(['/laboratories/product-form']);
  }
}
