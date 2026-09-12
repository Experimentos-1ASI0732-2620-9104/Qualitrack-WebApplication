import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { RecoverPasswordAssembler } from './recover-password-assembler';
import { RecoverPasswordRequest } from './recover-password.request';
import { RecoverPasswordResource, RecoverPasswordResponse } from './recover-password-response';

const recoverPasswordApiEndpointUrl = `${environment.serverBasePath}${environment.iamRecoverPasswordEndpointPath}`;

/**
 * HTTP endpoint client for password recovery operations.
 *
 * @remarks
 * This endpoint belongs to the infrastructure layer and encapsulates the HTTP
 * communication with the backend password recovery endpoint.
 *
 * It receives a RecoverPasswordRequest DTO, sends it to the API, and delegates
 * response transformation to RecoverPasswordAssembler.
 */
export class RecoverPasswordApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates a new RecoverPasswordApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to execute HTTP requests
   * @param assembler - Assembler used to map backend responses into resources
   */
  constructor(
    private readonly http: HttpClient,
    private readonly assembler: RecoverPasswordAssembler,
  ) {
    super();
  }

  /**
   * Requests password recovery for an existing account.
   *
   * @param request - Password recovery request payload
   * @returns Observable stream emitting the recovery result resource
   */
  recoverPassword(request: RecoverPasswordRequest): Observable<RecoverPasswordResource> {
    return this.http.post<RecoverPasswordResponse>(recoverPasswordApiEndpointUrl, request).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to request password recovery')),
    );
  }
}
