import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';
import { RawMaterialAssembler } from './raw-material-assembler';
import { SaveRawMaterialRequest } from './raw-material.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

export class RawMaterialApiEndpoint extends BaseApiEndpoint<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse,
  RawMaterialAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialAssembler());
  }
  getByLaboratory(lab: number) {
    return this.http
      .get<RawMaterialResource[]>(
        `${this.endpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryMaterialsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError('Failed to load inventory catalogue')),
      );
  }
  saveMaterial(lab: number, request: SaveRawMaterialRequest, id?: number) {
    const url = `${this.endpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryMaterialsEndpointPath}`;
    const response = id
      ? this.http.put<RawMaterialResource>(`${url}/${id}`, request)
      : this.http.post<RawMaterialResource>(url, request);
    return response.pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to save inventory material')),
    );
  }
}
