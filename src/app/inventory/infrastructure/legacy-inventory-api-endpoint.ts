import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { LegacyMaterialResource, LegacyImportResponse } from './legacy-inventory-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/** Read-only legacy snapshot and one-time transfer, not a second writable catalogue. */
export class LegacyInventoryApiEndpoint extends ErrorHandlingEnabledBaseType {
  constructor(private readonly http: HttpClient) {
    super();
  }
  private root(lab: number) {
    return `${laboratoriesEndpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryLegacyMaterialsEndpointPath}`;
  }
  pending(lab: number) {
    return this.http.get<LegacyMaterialResource[]>(this.root(lab)).pipe(
      map((resources) =>
        resources.map((resource): LegacyMaterial => ({
          id: resource.id,
          code: resource.code,
          name: resource.name,
          unit: resource.unit,
          balance: resource.balance,
          supplier: resource.supplier,
          batchNumber: resource.batchNumber,
          expiresOn: resource.expiresOn,
        })),
      ),
      catchError(this.handleError('Failed to load previous balances')),
    );
  }
  importMaterial(lab: number, id: number) {
    return this.http
      .post<LegacyImportResponse>(
        `${this.root(lab)}/${id}${environment.inventoryLegacyImportEndpointPath}`,
        {},
      )
      .pipe(catchError(this.handleError('Failed to import previous balance')));
  }
}
