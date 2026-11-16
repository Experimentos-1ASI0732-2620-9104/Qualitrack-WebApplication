import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertPerson } from '../domain/model/alert-person.entity';
import { AlertPersonAssembler } from './alert-person-assembler';
import {
  AlertOwnProfileResource,
  AlertStaffResource,
  AlertUserResource,
} from './alert-person-response';

const serverUrl = environment.serverBasePath;
const usersEndpointUrl = `${serverUrl}${environment.usersEndpointPath}`;
const laboratoriesEndpointUrl = `${serverUrl}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the people that alerts name.
 *
 * @remarks
 * Reads the accounts of IAM, the staff of Laboratory Management and the profile of the signed-in user. A source that
 * fails only leaves its names out, because alerts can always be shown without them.
 */
export class AlertPersonApiEndpoint {
  private readonly assembler = new AlertPersonAssembler();

  constructor(private readonly http: HttpClient) {}

  /**
   * Reads the people of a laboratory.
   *
   * @param laboratoryId - The laboratory identifier
   * @returns Observable emitting the people whose name is known. It never errors.
   */
  getPeople(laboratoryId: number): Observable<AlertPerson[]> {
    return forkJoin({
      users: this.http.get<AlertUserResource[]>(usersEndpointUrl).pipe(catchError(() => of([]))),
      staff: this.http
        .get<AlertStaffResource[]>(
          `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryStaffEndpointPath}`,
        )
        .pipe(catchError(() => of([]))),
      ownProfile: this.http
        .get<AlertOwnProfileResource>(
          `${usersEndpointUrl}${environment.profileCurrentUserEndpointPath}`,
        )
        .pipe(catchError(() => of(null))),
    }).pipe(
      map(({ users, staff, ownProfile }) => this.assembler.toEntities(users, staff, ownProfile)),
    );
  }
}
