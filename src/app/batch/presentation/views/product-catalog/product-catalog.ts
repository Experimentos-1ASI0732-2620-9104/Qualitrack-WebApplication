import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ProductStore } from '../../../application/product.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';

/**
 * Pharmaceutical products of an environment, with registration for quality roles.
 *
 * @remarks
 * The environment is taken from the route and can be changed with the environment selector. The list can be
 * filtered by product code or name.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-product-catalog',
  standalone: true,
  providers: [ProductStore],
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    EnvironmentSelector,
  ],
  templateUrl: './product-catalog.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class ProductCatalog implements OnInit {
  protected readonly store = inject(ProductStore);
  private readonly environments = inject(EnvironmentStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);

  /**
   * Text typed in the search box.
   */
  protected readonly search = signal('');

  /**
   * Products whose code or name contain the search text.
   */
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.store
      .products()
      .filter((product) => `${product.code} ${product.name}`.toLowerCase().includes(term));
  });

  /**
   * Lifecycle hook that loads the products of the environment of the route every time it changes.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(async (params) => {
      const environmentId = Number(params.get('environmentId'));
      this.search.set('');
      // Only environments the account can open become the default one.
      if (await this.store.load(environmentId))
        this.environments.rememberEnvironment(environmentId, 'production');
    });
  }

  /**
   * Opens the products of another environment.
   *
   * @param environmentId - The environment selected in the selector.
   */
  protected changeEnvironment(environmentId: number): void {
    void this.router.navigate(['/batches/environments', environmentId, 'products']);
  }
}
