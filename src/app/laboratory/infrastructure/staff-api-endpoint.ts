import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { StaffMember } from '../domain/model/staff-member.entity';
import { RegisteredStaff } from '../domain/model/register-staff.command';
import { RegisteredStaffResource, StaffMemberResource, StaffMembersResponse } from './staff-response';
import { StaffAssembler } from './staff-assembler';
import { RegisterStaffRequest } from './staff.request';

/**
 * Base URL of the laboratories resource, built from the environment configuration.
 */
const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP endpoint client for laboratory staff operations.
 *
 * @remarks
 * This endpoint handles staff listing, registration (which creates the account of the staff
 * member) and deactivation under /laboratories/{laboratoryId}/staff.
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
    return this.http.get<StaffMemberResource[]>(this.staffUrl(laboratoryId)).pipe(
      map((resources) =>
        resources.map((resource) => this.assembler.toEntityFromResource(resource)),
      ),
      catchError(this.handleError(`Failed to fetch staff for laboratory ${laboratoryId}`)),
    );
  }

  /**
   * Retrieves one staff member of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member
   * @returns Observable stream emitting the StaffMember domain entity
   */
  getStaffMember(laboratoryId: number, staffId: number): Observable<StaffMember> {
    return this.http.get<StaffMemberResource>(`${this.staffUrl(laboratoryId)}/${staffId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch staff member ${staffId}`)),
    );
  }

  /**
   * Registers a staff member; the platform creates their account and sends the credentials.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param request - Staff member data
   * @returns Observable stream emitting the registered staff member and their credentials delivery
   */
  registerStaff(laboratoryId: number, request: RegisterStaffRequest): Observable<RegisteredStaff> {
    return this.http.post<RegisteredStaffResource>(this.staffUrl(laboratoryId), request).pipe(
      map((resource) => ({
        staffMember: this.assembler.toEntityFromResource(resource.staffMember),
        credentials: { ...resource.credentials },
      })),
      catchError(this.handleError('Failed to register staff member')),
    );
  }

  /**
   * Deactivates a staff member and disables their account.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param staffId - Numeric identifier of the staff member to deactivate
   * @returns Observable stream emitting the deactivated staff member
   */
  deactivateStaff(laboratoryId: number, staffId: number): Observable<StaffMember> {
    return this.http
      .post<StaffMemberResource>(
        `${this.staffUrl(laboratoryId)}/${staffId}${environment.laboratoryStaffDeactivationsEndpointPath}`, {})
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to deactivate staff member ${staffId}`)),
      );
  }

  /**
   * Builds the URL of the staff collection of a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @returns URL of the staff collection
   */
  private staffUrl(laboratoryId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryStaffEndpointPath}`;
  }
}
