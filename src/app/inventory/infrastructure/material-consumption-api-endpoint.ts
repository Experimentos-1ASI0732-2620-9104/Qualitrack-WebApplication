import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { MaterialConsumptionResource } from './material-consumption-response';
import { MaterialConsumptionAssembler } from './material-consumption-assembler';

/** Reads the Product Batch consumption resources through Inventory's own anti-corruption layer. */
export class MaterialConsumptionApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new MaterialConsumptionAssembler();
  constructor(private readonly http: HttpClient) { super(); }

  /** Production batches that consumed lots of an Inventory material. */
  getByEnvironmentMaterial(laboratoryId: number, environmentId: number, rawMaterialId: number): Observable<MaterialConsumption[]> {
    return this.read(`${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}/${rawMaterialId}${environment.inventoryRawMaterialUsagesEndpointPath}`);
  }

  /** Historical consumption of a material registered before Inventory Management existed. */
  getByLegacyMaterial(laboratoryId: number, rawMaterialId: number): Observable<MaterialConsumption[]> {
    return this.read(`${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}` +
          `${environment.laboratoryRawMaterialsEndpointPath}/${rawMaterialId}${environment.inventoryRawMaterialUsagesEndpointPath}`);
  }

  private read(url: string): Observable<MaterialConsumption[]> {
    return this.http.get<MaterialConsumptionResource[]>(url).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch material consumptions')),
    );
  }
}
