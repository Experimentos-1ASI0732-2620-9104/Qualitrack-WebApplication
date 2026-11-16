import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { AuditedStaffMember } from '../domain/model/audited-staff-member.entity';
import { AuditedStaffMemberResource } from './audited-staff-member-response';
import { AuditedStaffMemberAssembler } from './audited-staff-member-assembler';

const laboratoriesEndpointUrl =   environment.serverBasePath + environment.laboratoryLabsEndpointPath;

/** Reads a staff identity through the Laboratory → Reporting & Audit anti-corruption layer. */
export class AuditedStaffMemberApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new AuditedStaffMemberAssembler();

  constructor(private readonly http: HttpClient) { super(); }

  /** Reads GET /laboratories/{laboratoryId}/staff/{staffId}. */
  getStaffMember(laboratoryId: number, staffId: number): Observable<AuditedStaffMember> {
    const url = laboratoriesEndpointUrl + '/' + laboratoryId + environment.laboratoryStaffEndpointPath + '/' + staffId;
    return this.http.get<AuditedStaffMemberResource>(url).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch the audited staff member')),
    );
  }
}
