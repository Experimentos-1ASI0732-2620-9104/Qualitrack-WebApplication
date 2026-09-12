import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { SignInAssembler } from './sign-in-assembler';
import { SignInRequest } from './sign-in.request';
import { SignInResource, SignInResponse } from './sign-in-response';

const signInApiEndpointUrl = `${environment.serverBasePath}${environment.iamSignInEndpointPath}`;

/**
 * HTTP endpoint client for user sign-in operations.
 *
 * @remarks
 * This endpoint belongs to the infrastructure layer and encapsulates the HTTP
 * communication with the backend sign-in endpoint.
 *
 * It receives a SignInRequest DTO, sends it to the API, and delegates response
 * transformation to SignInAssembler.
 */
export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates a new SignInApiEndpoint instance.
   *
   * @param http - Angular HttpClient used to execute HTTP requests
   * @param assembler - Assembler used to map backend responses into resources
   */
  constructor(
    private readonly http: HttpClient,
    private readonly assembler: SignInAssembler,
  ) {
    super();
  }

  /**
   * Authenticates an existing user.
   *
   * @param request - Sign-in request payload containing username and password
   * @returns Observable stream emitting the authenticated session resource
   */
  signIn(request: SignInRequest): Observable<SignInResource> {
    return this.http.post<SignInResponse>(signInApiEndpointUrl, request).pipe(
      map((response) => this.assembler.toResourceFromResponse(response)),
    );
  }
}
