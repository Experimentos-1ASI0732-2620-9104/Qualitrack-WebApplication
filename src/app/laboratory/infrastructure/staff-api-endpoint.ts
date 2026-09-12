import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { StaffMember } from '../domain/model/staff-member.entity';
import { StaffMemberResource, StaffMembersResponse } from './staff-response';
import { StaffAssembler } from './staff-assembler';
import { RegisterStaffRequest } from './staff.request';
import { MessageResource } from '../../shared/infrastructure/message-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
const staffEndpointUrl = `${environment.serverBasePath}${environment.laboratoryStaffEndpointPath}`;

/**
 * HTTP endpoint client for laboratory staff operations.
 *
 * @remarks
 * This endpoint handles staff listing, registration, and status updates.
 */
export class StaffApiEndpoint extends BaseApiEndpoint<
  StaffMember,
  StaffMemberResource,
  StaffMembersResponse,
  StaffAssembler
> {
  /**
   * Creates a new StaffApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to perform HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new StaffAssembler());
  }

  /**
   * Retrieves all staff members associated with a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns Observable stream emitting StaffMember domain entities
   */
  getStaffByLaboratoryId(laboratoryId: number): Observable<StaffMember[]> {
    return this.http.get<StaffMemberResource[]>(`${this.endpointUrl}/${laboratoryId}/staff`).pipe(
      map((resources) =>
        resources.map((resource) => this.assembler.toEntityFromResource(resource)),
      ),
      catchError(this.handleError(`Failed to fetch staff for laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Registers a new staff member under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Request payload containing staff registration data
   * @returns Observable stream emitting a message response
   */
  registerStaff(laboratoryId: number, request: RegisterStaffRequest): Observable<MessageResource> {
    return this.http
      .post<MessageResource>(`${this.endpointUrl}/${laboratoryId}/staff`, request)
      .pipe(catchError(this.handleError('Failed to register staff member')));
  }

  /**
   * Deactivates an existing staff member.
   *
   * @param staffId - Numeric identifier of the staff member to deactivate
   * @returns Observable stream completing when the deactivation succeeds
   *
   * @remarks
   * Maps to `PATCH /staff/{staffId}` with `{ active: false }`.
   */
  deactivateStaff(staffId: number): Observable<void> {
    return this.http
      .patch<MessageResource>(`${staffEndpointUrl}/${staffId}`, { active: false })
      .pipe(
        map(() => undefined),
        catchError(this.handleError(`Failed to deactivate staff member ${staffId}`)),
      );
  }
}
