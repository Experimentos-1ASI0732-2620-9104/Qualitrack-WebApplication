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

import { RecoverPasswordApiEndpoint } from './recover-password-api-endpoint';
import { RecoverPasswordAssembler } from './recover-password-assembler';
import { RecoverPasswordRequest } from './recover-password.request';
import { RecoverPasswordResource } from './recover-password-response';

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
  private readonly recoverPasswordEndpoint: RecoverPasswordApiEndpoint;

  /**
   * Creates a new IamApi facade.
   *
   * @param http - Angular HttpClient used by endpoint clients
   */
  constructor(private readonly http: HttpClient) {
    super();
    this.signInEndpoint = new SignInApiEndpoint(http, new SignInAssembler());
    this.signUpEndpoint = new SignUpApiEndpoint(http, new SignUpAssembler());
    this.recoverPasswordEndpoint = new RecoverPasswordApiEndpoint(
      http,
      new RecoverPasswordAssembler(),
    );
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

  getOnboarding(): Observable<OnboardingState> {
    return this.http.get<OnboardingState>(`${environment.serverBasePath}/users/me/onboarding`);
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
  recoverPassword(request: RecoverPasswordRequest): Observable<RecoverPasswordResource> {
    return this.recoverPasswordEndpoint.recoverPassword(request);
  }
}
