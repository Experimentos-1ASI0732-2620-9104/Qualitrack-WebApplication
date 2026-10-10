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
import { TranslateModule } from '@ngx-translate/core';
import { ProductStore } from '../../../application/product.store';

/**
 * Registers a pharmaceutical product in the environment taken from the route.
 *
 * @remarks
 * Only quality managers and administrators can register products; for other users the form shows a notice
 * and the submit button is disabled. When the product is registered, the view opens its detail.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  providers: [ProductStore],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class ProductForm implements OnInit {
  protected readonly store = inject(ProductStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * Identifier of the environment, taken from the route.
   */
  protected environmentId = 0;

  /**
   * Form of the product: code (up to 50 characters), name (up to 150), optional description (up to 500) and
   * specifications (up to 1000).
   */
  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(500)],
    specifications: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  /**
   * Lifecycle hook that reads the environment of the route.
   */
  ngOnInit(): void {
    this.environmentId = Number(this.route.snapshot.paramMap.get('environmentId'));
    this.store.environmentId.set(this.environmentId);
  }

  /**
   * Route of the products of the environment.
   *
   * @returns The router link segments of the catalog.
   */
  protected get catalogueLink(): (string | number)[] {
    return ['/batches/environments', this.environmentId, 'products'];
  }

  /**
   * Validates the form, registers the product and opens its detail.
   */
  protected async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const product = await this.store.create(this.environmentId, {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || null,
      specifications: value.specifications.trim(),
    });
    if (product) await this.router.navigate([...this.catalogueLink, product.id]);
  }
}
