import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import { BatchStore } from '../../../application/batch.store';
import { ProductStore } from '../../../application/product.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';

/**
 * Registers a manufacturing batch of the product taken from the route.
 *
 * @remarks
 * The product is loaded to show its name in the back link. When the batch is registered, the view
 * navigates to its detail.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-form',
  standalone: true,
  providers: [ProductStore],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './batch-form.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchForm implements OnInit {
  protected readonly store = inject(BatchStore);
  protected readonly products = inject(ProductStore);
  private readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * Production units offered by the form.
   */
  protected readonly units = ['units', 'kg', 'g', 'L', 'mL'];

  /**
   * Laboratory, environment and product of the batch, taken from the route.
   */
  protected path!: BatchPath;

  /**
   * Form of the batch: number (up to 50 characters), quantity (at least 0.001), unit, start date (today by
   * default) and optional notes (up to 500 characters).
   */
  protected readonly form = this.fb.nonNullable.group({
    batchNumber: ['', [Validators.required, Validators.maxLength(50)]],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    unit: ['units', Validators.required],
    startDate: [localIsoDate(), Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  /**
   * Lifecycle hook that reads the route parameters and loads the product of the batch.
   */
  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.path = {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId: Number(params.get('environmentId')),
      productId: Number(params.get('productId')),
    };
    this.store.clearMessages();
    void this.products.loadProduct(this.path.environmentId, this.path.productId);
  }

  /**
   * Route of the product the batch will belong to.
   *
   * @returns The router link segments of the product.
   */
  protected get productLink(): (string | number)[] {
    return ['/batches/environments', this.path.environmentId, 'products', this.path.productId];
  }

  /**
   * Validates the form, registers the batch and opens its detail.
   */
  protected async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const batch = await this.store.createBatch(this.path, {
      batchNumber: value.batchNumber.trim(),
      quantity: Number(value.quantity),
      unit: value.unit,
      startDate: value.startDate,
      notes: value.notes.trim() || undefined,
    });
    if (batch?.detailLink) await this.router.navigate(batch.detailLink);
  }
}
