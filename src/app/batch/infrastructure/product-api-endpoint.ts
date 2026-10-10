import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  map
} from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import {
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse
} from './product-response';
import { ProductAssembler } from './product-assembler';
import { CreateProductRequest } from './product.request';

/**
 * Base URL of the laboratories resource.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the pharmaceutical products of an environment.
 *
 * @remarks
 * Products live under /laboratories/{laboratoryId}/environments/{environmentId}/products. Data
 * transformation is delegated to {@link ProductAssembler}.
 *
 * @author Qualitrack
 */
export class ProductApiEndpoint extends BaseApiEndpoint<
  PharmaceuticalProduct,
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse,
  ProductAssembler
> {
  /**
   * Creates an instance of ProductApiEndpoint.
   *
   * @param http - Angular HttpClient for making HTTP requests.
   */
  constructor(http: HttpClient) {
    super(
      http,
      laboratoriesEndpointUrl,
      new ProductAssembler()
    );
  }

  /**
   * Retrieves the products of an environment.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the products are manufactured.
   * @returns An Observable emitting the products of the environment.
   */
  getProducts(
    laboratoryId: number,
    environmentId: number
  ): Observable<PharmaceuticalProduct[]> {
    return this.http
      .get<PharmaceuticalProductResource[]>(this.collection(laboratoryId, environmentId))
      .pipe(
        map((resources) =>
          resources.map((resource) =>
            this.assembler.toEntityFromResource(resource)
          ),
        ),
        catchError(this.handleError(`Failed to fetch products of environment ${environmentId}`))
      );
  }

  /**
   * Retrieves a product by its ID.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the product is manufactured.
   * @param productId - The product identifier.
   * @returns An Observable emitting the product.
   */
  getProduct(
    laboratoryId: number,
    environmentId: number,
    productId: number,
  ): Observable<PharmaceuticalProduct> {
    return this.http
      .get<PharmaceuticalProductResource>(
        `${this.collection(laboratoryId, environmentId)}/${productId}`,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch product ${productId}`)),
      );
  }

  /**
   * Registers a product in an environment.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the product will be manufactured.
   * @param request - Code, name, description and specifications of the product.
   * @returns An Observable emitting the registered product.
   */
  createProduct(
    laboratoryId: number,
    environmentId: number,
    request: CreateProductRequest,
  ): Observable<PharmaceuticalProduct> {
    return this.http
      .post<PharmaceuticalProductResource>(this.collection(laboratoryId, environmentId), request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to register pharmaceutical product'))
      );
  }

  /**
   * Builds the URL of the products collection of an environment.
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment of the products.
   * @returns The URL of the collection.
   */
  private collection(
    laboratoryId: number,
    environmentId: number
  ): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.productsEndpointPath}`;
  }
}
