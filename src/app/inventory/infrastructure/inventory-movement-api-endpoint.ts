import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import {
  InventoryMovementResource,
  InventoryMovementsResponse,
} from './inventory-movement-response';
import { InventoryMovementAssembler } from './inventory-movement-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

export class InventoryMovementApiEndpoint extends BaseApiEndpoint<
  InventoryMovement,
  InventoryMovementResource,
  InventoryMovementsResponse,
  InventoryMovementAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new InventoryMovementAssembler());
  }
  getByMaterial(lab: number, material: number) {
    return this.http
      .get<InventoryMovementResource[]>(
        `${this.endpointUrl}/${lab}${environment.inventoryEndpointPath}${environment.inventoryMaterialsEndpointPath}/${material}${environment.inventoryMovementsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError('Failed to load inventory movements')),
      );
  }
}
