import {
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import {
  DatePipe,
  DecimalPipe
} from '@angular/common';
import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ProductStore } from '../../../application/product.store';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * A pharmaceutical product and its manufacturing batches.
 *
 * @remarks
 * The product is identified by the route (environment and product). Users who operate can register a new
 * batch of the product from this view.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  providers: [ProductStore],
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './product-detail.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class ProductDetail implements OnInit {
  protected readonly products = inject(ProductStore);
  protected readonly batches = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);

  /**
   * Identifier of the environment, taken from the route.
   */
  protected environmentId = 0;

  /**
   * Identifier of the product, taken from the route.
   */
  protected productId = 0;

  /**
   * Lifecycle hook that loads the product and its batches every time the route parameters change.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.environmentId = Number(params.get('environmentId'));
      this.productId = Number(params.get('productId'));
      void this.products.loadProduct(this.environmentId, this.productId);
      void this.batches.loadProductBatches({
        laboratoryId: this.iam.requireLaboratoryId(),
        environmentId: this.environmentId,
        productId: this.productId,
      });
    });
  }

  /**
   * Route of a batch of the product, or of its registration form.
   *
   * @param batch - The batch identifier, or `new` for the registration form.
   * @returns The router link segments.
   */
  protected batchLink(batch: number | 'new'): (string | number)[] {
    return [
      '/batches/environments',
      this.environmentId,
      'products',
      this.productId,
      'batches',
      batch,
    ];
  }

  /**
   * Builds the translation key suffix of a batch status (e.g., `IN_PROGRESS` becomes `in-progress`).
   *
   * @param status - The batch status.
   * @returns The key suffix.
   */
  protected statusKey(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
