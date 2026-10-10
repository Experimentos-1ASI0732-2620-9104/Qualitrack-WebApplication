import {
  Injectable,
  inject,
  signal
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { BatchApi } from '../infrastructure/batch-api';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { CreateProductCommand } from '../domain/model/create-product.command';
import { batchError } from './batch.store';

/**
 * Pharmaceutical products of one environment of the current laboratory.
 *
 * @remarks
 * Each product view provides its own instance and sets the environment taken from the route. A generation
 * counter discards the answers of outdated requests, so a slow response never overwrites a newer one.
 *
 * @example
 * ```typescript
 * // In the component: providers: [ProductStore]
 * const store = inject(ProductStore);
 *
 * await store.load(environmentId);
 * const products = store.products();
 * ```
 *
 * @author Qualitrack
 */
@Injectable()
export class ProductStore {
  private readonly api = inject(BatchApi);
  private readonly iam = inject(IamStore);
  /** Identifies the latest request; answers of older generations are ignored. */
  private generation = 0;

  /** The environment whose products are shown; null until one is loaded. */
  readonly environmentId = signal<number | null>(null);
  /** Products of the environment. */
  readonly products = signal<PharmaceuticalProduct[]>([]);
  /** The product opened in the detail view; null while none is loaded. */
  readonly product = signal<PharmaceuticalProduct | null>(null);
  /** Whether a read request is in progress. */
  readonly loading = signal(false);
  /** Whether a write request is in progress. */
  readonly saving = signal(false);
  /** Translation key or server message of the last failure; null when there is none. */
  readonly error = signal<string | null>(null);
  /** Products are registered by quality managers and administrators. */
  readonly canManage = this.iam.canManageQuality;

  /**
   * Loads the products of the environment.
   *
   * @param environmentId - The environment identifier.
   * @returns True when the products were loaded; false when the request failed or was superseded.
   */
  async load(environmentId: number): Promise<boolean> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.loading.set(true);
    this.error.set(null);
    try {
      const products = await firstValueFrom(this.api.getProducts(this.laboratoryId, environmentId));
      if (generation !== this.generation) return false;
      this.products.set(products);
      return true;
    } catch (error) {
      if (generation === this.generation) {
        this.products.set([]);
        this.error.set(batchError(error));
      }
      return false;
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /**
   * Loads one product of the environment.
   *
   * @param environmentId - The environment identifier.
   * @param productId - The product identifier.
   */
  async loadProduct(
    environmentId: number,
    productId: number
  ): Promise<void> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.product.set(null);
    this.loading.set(true);
    this.error.set(null);
    try {
      const product = await firstValueFrom(
        this.api.getProduct(this.laboratoryId, environmentId, productId),
      );
      if (generation === this.generation) this.product.set(product);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /**
   * Registers a product in the environment and returns it.
   *
   * @param environmentId - The environment where the product will be manufactured.
   * @param command - The data of the product; a blank description is sent as null.
   * @returns The registered product, or null when the request failed or another one is in progress.
   */
  async create(
    environmentId: number,
    command: CreateProductCommand,
  ): Promise<PharmaceuticalProduct | null> {
    if (this.saving()) return null;
    this.saving.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(
        this.api.createProduct(this.laboratoryId, environmentId, {
          ...command,
          description: command.description?.trim() || null,
        }),
      );
    } catch (error) {
      this.error.set(batchError(error));
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * The laboratory of the signed-in user.
   */
  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
