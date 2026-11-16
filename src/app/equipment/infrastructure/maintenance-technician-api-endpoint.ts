import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { MaintenanceTechnician } from '../domain/model/maintenance-technician.entity';
import { MaintenanceTechnicianResource } from './maintenance-technician-response';
import { MaintenanceTechnicianAssembler } from './maintenance-technician-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the staff members who perform maintenance.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/staff` of Laboratory Management and translates it with
 * {@link MaintenanceTechnicianAssembler}.
 */
export class MaintenanceTechnicianApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new MaintenanceTechnicianAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the staff of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getStaff(laboratoryId: number): Observable<MaintenanceTechnician[]> {
    return this.http
      .get<MaintenanceTechnicianResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryStaffEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the staff of laboratory ${laboratoryId}`)),
      );
  }
}
