import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { ConsumableLot } from '../domain/model/consumable-lot.entity';
import { ConsumableRawMaterial } from '../domain/model/consumable-raw-material.entity';
import { ConsumableLotResource, ConsumableRawMaterialResource } from './consumable-stock-response';
import { ConsumableStockAssembler } from './consumable-stock-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the raw materials and lots that production batches consume.
 *
 * @remarks
 * Reads the raw materials of a storage environment and their usable lots from Inventory Management and translates
 * them with {@link ConsumableStockAssembler}.
 */
export class ConsumableStockApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ConsumableStockAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the raw materials of an environment.
   *
   * @param laboratoryId - The laboratory identifier
   * @param environmentId - The environment where the raw materials are kept
   */
  getRawMaterials(laboratoryId: number, environmentId: number): Observable<ConsumableRawMaterial[]> {
    return this.http.get<ConsumableRawMaterialResource[]>(this.rawMaterials(laboratoryId, environmentId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toRawMaterial(resource))),
      catchError(this.handleError(`Failed to fetch the raw materials of environment ${environmentId}`)),
    );
  }

  /**
   * Reads the usable lots of a raw material: released, not expired and with stock.
   *
   * @param laboratoryId - The laboratory identifier
   * @param environmentId - The environment where the raw material is kept
   * @param rawMaterialId - The raw material identifier
   */
  getUsableLots(laboratoryId: number, environmentId: number, rawMaterialId: number): Observable<ConsumableLot[]> {
    return this.http
      .get<ConsumableLotResource[]>(
        `${this.rawMaterials(laboratoryId, environmentId)}/${rawMaterialId}${environment.inventoryRawMaterialBatchesEndpointPath}`,
        { params: new HttpParams().set('usable', true) },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toLot(resource))),
        catchError(this.handleError(`Failed to fetch the usable lots of raw material ${rawMaterialId}`)),
      );
  }

  private rawMaterials(laboratoryId: number, environmentId: number): string {
    return `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}`;
  }
}
