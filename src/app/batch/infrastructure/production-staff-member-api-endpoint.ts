import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { ProductionStaffMember } from '../domain/model/production-staff-member.entity';
import { ProductionStaffMemberResource } from './production-staff-member-response';
import { ProductionStaffMemberAssembler } from './production-staff-member-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the staff members who take part in production batches.
 *
 * @remarks
 * Reads `GET /laboratories/{laboratoryId}/staff` of Laboratory Management and translates it with
 * {@link ProductionStaffMemberAssembler}.
 */
export class ProductionStaffMemberApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new ProductionStaffMemberAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Reads the staff of the laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   */
  getStaff(laboratoryId: number): Observable<ProductionStaffMember[]> {
    return this.http
      .get<ProductionStaffMemberResource[]>(`${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryStaffEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch the staff of laboratory ${laboratoryId}`)),
      );
  }
}
