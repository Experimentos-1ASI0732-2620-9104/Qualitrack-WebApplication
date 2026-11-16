import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { ProductionEquipment } from '../domain/model/production-equipment.entity';
import { ProductionEquipmentResource } from './production-equipment-response';
import { ProductionEquipmentAssembler } from './production-equipment-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the equipment that production batches use.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/equipments` of Equipment Management and translates it with
 * {@link ProductionEquipmentAssembler}.
 */
export class ProductionEquipmentApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ProductionEquipmentAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the equipment and IoT devices of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getEquipment(laboratoryId: number): Observable<ProductionEquipment[]> {
    return this.http
      .get<ProductionEquipmentResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.equipmentEndpointPath}`)
      .pipe(
        map((resources) =>
          resources
            .filter((resource) => resource.laboratoryId === laboratoryId)
            .map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError(`Failed to fetch the equipment of laboratory ${laboratoryId}`)),
      );
  }
}
