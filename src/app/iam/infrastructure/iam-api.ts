import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OnboardingState } from '../domain/model/onboarding-state';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignInAssembler } from './sign-in-assembler';
import { SignInRequest } from './sign-in.request';
import { SignInResource } from './sign-in-response';

import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpRequest } from './sign-up.request';
import { SignUpResource } from './sign-up-response';
import { ChangePasswordRequest } from './change-password.request';
import { UpdateAccountRequest } from './update-account.request';

import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint';
import { PasswordRecoveryRequest, PasswordResetRequest } from './password-recovery.request';
import { PasswordRecoveryAcceptedResource, PasswordResetCompletedResource } from './password-recovery-response';

/**
 * HTTP API facade for Identity and Access Management operations.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this service belongs to the
 * infrastructure layer and acts as a facade over IAM endpoint clients.
 *
 * It exposes authentication-related API operations to the application layer
 * while keeping HTTP details isolated inside endpoint classes.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  /**
   * Endpoint client responsible for sign-in operations.
   */
  private readonly signInEndpoint: SignInApiEndpoint;

  /**
   * Endpoint client responsible for sign-up operations.
   */
  private readonly signUpEndpoint: SignUpApiEndpoint;

  /**
   * Endpoint client responsible for password recovery operations.
   */
  private readonly passwordRecoveryEndpoint: PasswordRecoveryApiEndpoint;

  /**
   * Creates a new IamApi facade.
   *
   * @param http - Angular HttpClient used by endpoint clients
   */
  constructor(private readonly http: HttpClient) {
    super();
    this.signInEndpoint = new SignInApiEndpoint(http, new SignInAssembler());
    this.signUpEndpoint = new SignUpApiEndpoint(http, new SignUpAssembler());
    this.passwordRecoveryEndpoint = new PasswordRecoveryApiEndpoint(http);
  }

  /**
   * Authenticates an existing user.
   *
   * @param request - Sign-in request payload
   * @returns Observable stream emitting the authenticated session resource
   */
  signIn(request: SignInRequest): Observable<SignInResource> {
    return this.signInEndpoint.signIn(request);
  }

  /**
   * Reads the onboarding state of the authenticated user (GET /users/me/onboarding).
   *
   * @returns Observable emitting the next step the user must complete
   */
  getOnboarding(): Observable<OnboardingState> {
    return this.http.get<OnboardingState>(`${environment.serverBasePath}/users/me/onboarding`);
  }

  /**
   * Changes the password of the authenticated user.
   *
   * @param request - current password and the new password
   * @returns completes when the platform answers 204 No Content
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${environment.serverBasePath}${environment.usersEndpointPath}${environment.currentUserPasswordChangesEndpointPath}`,
      request,
    );
  }

  /**
   * Replaces the username and the e-mail of the authenticated user.
   *
   * @param request - New username and e-mail with the current password
   * @returns The session with a new token: the previous one stops working
   */
  updateAccount(request: UpdateAccountRequest): Observable<SignInResource> {
    return this.http.put<SignInResource>(
      `${environment.serverBasePath}${environment.usersEndpointPath}${environment.currentUserAccountEndpointPath}`,
      request,
    );
  }

  /**
   * Registers a new user account.
   *
   * @param request - Sign-up request payload
   * @returns Observable stream emitting the registered user resource
   */
  signUp(request: SignUpRequest): Observable<SignUpResource> {
    return this.signUpEndpoint.signUp(request);
  }

  /**
   * Requests password recovery for an existing account.
   *
   * @param request - Password recovery request payload
   * @returns Observable stream emitting the recovery result resource
   */
  requestPasswordRecovery(request: PasswordRecoveryRequest): Observable<PasswordRecoveryAcceptedResource> {
    return this.passwordRecoveryEndpoint.requestRecovery(request);
  }

  /**
   * Sets a new password with the verification code received by e-mail.
   *
   * @param request - Account, verification code and new password
   * @returns Observable stream emitting the username to sign in with
   */
  resetPassword(request: PasswordResetRequest): Observable<PasswordResetCompletedResource> {
    return this.passwordRecoveryEndpoint.resetPassword(request);
  }
}
