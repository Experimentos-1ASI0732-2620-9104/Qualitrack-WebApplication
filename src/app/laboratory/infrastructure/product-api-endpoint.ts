import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { PharmaceuticalProductResource, PharmaceuticalProductsResponse } from './product-response';
import { ProductAssembler } from './product-assembler';
import { CreateProductRequest } from './product.request';
import { MessageResource } from '../../shared/infrastructure/message-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for pharmaceutical product operations.
 *
 * @remarks
 * This endpoint handles product listing and creation under a laboratory.
 */
export class ProductApiEndpoint extends BaseApiEndpoint<
  PharmaceuticalProduct,
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse,
  ProductAssembler
> {
  /**
   * Creates a new ProductApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new ProductAssembler());
  }

  /**
   * Retrieves all pharmaceutical products registered under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting PharmaceuticalProduct domain entities
   */
  getProductsByLaboratoryId(laboratoryId: number): Observable<PharmaceuticalProduct[]> {
    return this.http
      .get<PharmaceuticalProductResource[]>(`${this.endpointUrl}/${laboratoryId}/products`)
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch products for laboratory ${laboratoryId}`)),
      );
  }

  /**
   * Creates a new pharmaceutical product under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload containing product creation data
   * @returns Observable stream emitting a message response
   */
  createProduct(laboratoryId: number, request: CreateProductRequest): Observable<MessageResource> {
    return this.http
      .post<MessageResource>(`${this.endpointUrl}/${laboratoryId}/products`, request)
      .pipe(catchError(this.handleError('Failed to create pharmaceutical product')));
  }
}
