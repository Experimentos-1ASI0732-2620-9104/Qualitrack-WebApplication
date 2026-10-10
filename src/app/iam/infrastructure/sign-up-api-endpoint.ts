import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpRequest } from './sign-up.request';
import { SignUpResource, SignUpResponse } from './sign-up-response';

const signUpApiEndpointUrl = `${environment.serverBasePath}${environment.iamSignUpEndpointPath}`;

/**
 * HTTP endpoint client for user sign-up operations.
 *
 * @remarks
 * This endpoint belongs to the infrastructure layer and encapsulates the HTTP
 * communication with the backend sign-up endpoint.
 *
 * It receives a SignUpRequest DTO, sends it to the API, and delegates response
 * transformation to SignUpAssembler.
 */
export class SignUpApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates a new SignUpApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to execute HTTP requests
   * @param assembler - Assembler used to map backend responses into resources
   */
  constructor(
    private readonly http: HttpClient,
    private readonly assembler: SignUpAssembler,
  ) {
    super();
  }

  /**
   * Registers a new user account.
   *
   * @param request - Sign-up request payload containing username, password, and roles
   * @returns Observable stream emitting the registered user resource
   */
  signUp(request: SignUpRequest): Observable<SignUpResource> {
    return this.http.post<SignUpResponse>(signUpApiEndpointUrl, request).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
      // A conflict keeps its status: the username or the e-mail is already registered.
      catchError((error: HttpErrorResponse) => error.status === 409
        ? throwError(() => error) : this.handleError('Failed to sign up')(error)),
    );
  }
}
