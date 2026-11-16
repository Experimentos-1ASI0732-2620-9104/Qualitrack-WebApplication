import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { PasswordRecoveryRequest, PasswordResetRequest } from './password-recovery.request';
import { PasswordRecoveryAcceptedResource, PasswordResetCompletedResource } from './password-recovery-response';

/**
 * Public endpoints of the password recovery: the code is sent to the e-mail of the account and then used to set a new
 * password (TS05, TS06).
 *
 * @remarks
 * They are under `/authentication/`, so the authentication interceptor does not add the session token.
 */
export class PasswordRecoveryApiEndpoint extends ErrorHandlingEnabledBaseType {
  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(private readonly http: HttpClient) { super(); }

  /**
   * Asks the platform to e-mail a verification code to the account (TS05).
   *
   * @param request - Username or e-mail of the account
   * @returns Observable emitting how many minutes the code is valid; the answer is the same if the account does not
   *   exist
   */
  requestRecovery(request: PasswordRecoveryRequest): Observable<PasswordRecoveryAcceptedResource> {
    return this.http.post<PasswordRecoveryAcceptedResource>(
      `${environment.serverBasePath}${environment.iamPasswordRecoveryRequestsEndpointPath}`, request).pipe(catchError(this.handleError('Failed to request password recovery')));
  }

  /**
   * Sets a new password with the verification code (TS06).
   *
   * @param request - Account, verification code and new password
   * @returns Observable emitting the username to sign in with
   */
  resetPassword(request: PasswordResetRequest): Observable<PasswordResetCompletedResource> {
    return this.http.post<PasswordResetCompletedResource>(
      `${environment.serverBasePath}${environment.iamPasswordResetsEndpointPath}`, request).pipe(catchError(this.handleError('Failed to reset the password')));
  }
}
