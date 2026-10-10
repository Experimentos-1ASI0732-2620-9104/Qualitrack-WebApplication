import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { OnboardingState } from '../domain/model/onboarding-state';

import { User } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { ResetPasswordCommand } from '../domain/model/reset-password.command';
import { UpdateAccountCommand } from '../domain/model/update-account.command';

import { IamApi } from '../infrastructure/iam-api';
import { SignInRequest } from '../infrastructure/sign-in.request';
import { SignUpRequest } from '../infrastructure/sign-up.request';
import { SignInResource } from '../infrastructure/sign-in-response';

/**
 * Signal-based application store for Identity and Access Management.
 *
 * @remarks
 * Keeps the session of the signed-in user (token, id, username, roles and laboratory) in signals and in
 * `localStorage`, so it survives a page reload. It is provided in root: the guards, the interceptor and every bounded
 * context read the session from here. The onboarding state tells the guards which step the user must complete
 * (change the temporary password, set up the laboratory) before using the platform.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  /** Whether a sign-in or sign-up request is running. */
  private readonly _loadingSignal = signal<boolean>(false);
  /** Translation key of the latest sign-in or sign-up error. */
  private readonly _errorSignal = signal<string | null>(null);
  /** Whether there is a valid session. */
  private readonly isSignedInSignal = signal<boolean>(false);
  /** Username of the signed-in user. */
  private readonly currentUsernameSignal = signal<string | null>(null);
  /** Numeric id of the signed-in user. */
  private readonly currentUserIdSignal = signal<number | null>(null);
  /** Numeric id of the laboratory of the signed-in user, or null before it is set up. */
  private readonly currentLaboratoryIdSignal = signal<number | null>(null);
  /** Roles of the signed-in user (e.g. `ROLE_QA_MANAGER`). */
  private readonly currentRolesSignal = signal<string[]>([]);
  /** JWT bearer token of the session. */
  private readonly tokenSignal = signal<string | null>(null);
  /** Latest onboarding state read from the platform. */
  private readonly onboardingSignal = signal<OnboardingState | null>(null);
  /** Onboarding request in flight, shared by the guards that ask at the same time. */
  private onboardingRequest?: Observable<OnboardingState>;
  /** Time (ms) of the latest onboarding check, to reuse it for 2 seconds. */
  private onboardingCheckedAt = 0;
  /** Latest onboarding state read from the platform, or null if not checked yet. */
  readonly onboarding = this.onboardingSignal.asReadonly();
  /** Users of the laboratory. */
  private readonly usersSignal = signal<User[]>([]);
  /** Whether the users are being loaded. */
  private readonly loadingUsers = signal<boolean>(false);

  /** Whether there is a valid session. */
  readonly isSignedIn = this.isSignedInSignal.asReadonly();
  /** Username of the signed-in user, or null without session. */
  readonly currentUsername = this.currentUsernameSignal.asReadonly();
  /** Numeric id of the signed-in user, or null without session. */
  readonly currentUserId = this.currentUserIdSignal.asReadonly();
  /** Numeric id of the laboratory of the signed-in user, or null before it is set up. */
  readonly currentLaboratoryId = this.currentLaboratoryIdSignal.asReadonly();
  /** Roles of the signed-in user. */
  readonly currentRoles = this.currentRolesSignal.asReadonly();
  /** JWT bearer token sent by the authentication interceptor, or null without session. */
  readonly currentToken = this.tokenSignal.asReadonly();
  /** Users of the laboratory. */
  readonly users = this.usersSignal.asReadonly();
  /** Whether a sign-in or sign-up request is running. */
  readonly loading = this._loadingSignal.asReadonly();
  /** Translation key of the latest sign-in or sign-up error, or null. */
  readonly error = this._errorSignal.asReadonly();
  /** Whether the users are being loaded. */
  readonly isLoadingUsers = this.loadingUsers.asReadonly();

  /** First role of the user in a readable form (`ROLE_QA_MANAGER` → `Qa Manager`), or null without roles. */
  readonly currentPrimaryRole = computed(() => {
    const role = this.currentRoles()[0];

    if (!role) return null;

    return role
      .replace('ROLE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  });

  /**
   * Indicates whether the current user holds a quality management role
   * (ROLE_QA_MANAGER or ROLE_ADMIN), required by the backend for quality decisions.
   */
  readonly canManageQuality = computed(() =>
    this.currentRoles().some((role) => ['ROLE_ADMIN', 'ROLE_QA_MANAGER'].includes(role)),
  );

  /**
   * Indicates whether the current user is an auditor without another role: the platform only lets
   * them read, so the views hide the actions that register or change records.
   */
  readonly isAuditor = computed(() => {
    const roles = this.currentRoles();
    return roles.length > 0 && roles.every((role) => role === 'ROLE_AUDITOR');
  });

  /** Indicates whether the current user can register operational records (everyone but auditors). */
  readonly canOperate = computed(() => this.isSignedIn() && !this.isAuditor());

  /** Up to two initials of the username, shown in the avatar; `U` without session. */
  readonly currentUserInitials = computed(() => {
    const username = this.currentUsername();

    if (!username) return 'U';

    return username
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  });

  /**
   * Creates the store and restores the session saved in the browser, if it is still valid.
   *
   * @param iamApi - HTTP facade of the IAM bounded context
   */
  constructor(private readonly iamApi: IamApi) {
    this.restoreSession();
  }

  /**
   * Asks the platform to e-mail a verification code to the account (US16). The answer is the same whether or not the
   * account exists.
   *
   * @param account - Username or e-mail of the account
   * @returns Minutes during which the code can be used
   */
  requestPasswordRecovery(account: string): Observable<number> {
    return this.iamApi.requestPasswordRecovery({ account: account.trim() }).pipe(
      map((accepted) => accepted.codeValidityMinutes),
    );
  }

  /**
   * Sets a new password with the verification code received by e-mail (US17).
   *
   * @param command - Account, verification code and new password
   * @returns The username to sign in with
   */
  resetPassword(command: ResetPasswordCommand): Observable<string> {
    return this.iamApi.resetPassword({
      account: command.account.trim(),
      code: command.code.trim(),
      newPassword: command.newPassword,
    }).pipe(map((completed) => completed.username));
  }

  /**
   * Signs the user in and keeps the session.
   *
   * @remarks
   * On success it goes to `/iam/onboarding`, which sends the user to the step they must complete or to the dashboard.
   * On failure it stays in `/iam/sign-in` with `onboarding.connection-error` (no answer from the server) or
   * `onboarding.sign-in-error` (wrong credentials) in {@link error}.
   *
   * @param command - Username and password typed by the user
   * @param router - Router used to navigate after the answer
   */
  signIn(command: SignInCommand, router: Router): void {
    this.clearSession();
    this.startRequest();

    const request = this.toSignInRequest(command);

    this.iamApi.signIn(request).subscribe({
      next: (resource) => {
        this._errorSignal.set(null);
        this.storeSession(resource);
        this.finishRequest();

        router.navigate(['/iam/onboarding']).then();
      },
      error: (error) => {
        this.clearSession();
        this.failRequest(error instanceof HttpErrorResponse && error.status === 0
          ? 'onboarding.connection-error' : 'onboarding.sign-in-error');
        router.navigate(['/iam/sign-in']).then();
      },
    });
  }

  /**
   * Replaces the username and the e-mail of the signed-in account. The platform issues a new token because the token
   * names the user, so the session keeps working with it.
   *
   * @param command - New username and e-mail, confirmed with the current password
   * @returns Observable that completes once the account and the session are updated
   */
  updateAccount(command: UpdateAccountCommand): Observable<void> {
    return this.iamApi.updateAccount({
      username: command.username.trim(),
      email: command.email.trim(),
      currentPassword: command.currentPassword,
    }).pipe(
      tap((resource) => this.storeSession(resource)),
      map(() => undefined),
    );
  }

  /**
   * Registers a new account and sends the user to sign in with it.
   *
   * @remarks
   * A 409 answer means the username or e-mail is already registered (`iam.sign-up.errors.already-registered`).
   *
   * @param command - Data typed in the sign-up form
   * @param router - Router used to go to `/iam/sign-in` after the registration
   */
  signUp(command: SignUpCommand, router: Router): void {
    this.startRequest();

    const request = this.toSignUpRequest(command);

    this.iamApi.signUp(request).subscribe({
      next: () => {
        this.clearSession();
        this._errorSignal.set(null);
        this.finishRequest();
        router.navigate(['/iam/sign-in']).then();
      },
      error: (error) => {
        this.clearSession();
        this.failRequest(error instanceof HttpErrorResponse && error.status === 409
          ? 'iam.sign-up.errors.already-registered' : 'onboarding.sign-up-error');
      },
    });
  }

  /**
   * Replaces the password of the signed-in user. Staff members do it with the temporary password
   * received when their quality manager registered them, before using the platform.
   *
   * @param currentPassword - Current (or temporary) password
   * @param newPassword - New password
   * @returns Observable that completes once the password is changed; the onboarding state is checked again after it
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.iamApi.changePassword({ currentPassword, newPassword }).pipe(
      tap(() => this.invalidateOnboarding()),
    );
  }

  /**
   * Ends the session and goes to the home page.
   *
   * @param router - Router used to go to `/home`
   */
  signOut(router: Router): void {
    this.clearSession();
    router.navigate(['/home']).then();
  }

  /** Clears the latest sign-in or sign-up error. */
  clearError(): void {
    this._errorSignal.set(null);
  }

  /**
   * Reads the onboarding state of the signed-in user and updates the user and laboratory of the session with it.
   *
   * @remarks
   * Requests made at the same time share one HTTP call, and a state read less than 2 seconds ago is reused unless
   * `force` is set. If another session started while the request was running, the answer is discarded. A 401 answer
   * ends the session.
   *
   * @param force - Whether to ignore the recently read state
   * @returns Observable emitting the onboarding state; it fails with a 401 error without session
   */
  loadOnboarding(force = false): Observable<OnboardingState> {
    if (this.onboardingRequest) return this.onboardingRequest;
    const token = this.currentToken();
    if (!token) return throwError(() => new HttpErrorResponse({ status: 401 }));
    const cached = this.onboarding();
    if (!force && cached && Date.now() - this.onboardingCheckedAt < 2000) return of(cached);
    const request = this.iamApi.getOnboarding().pipe(
      tap((state) => {
        if (this.currentToken() !== token) throw new HttpErrorResponse({ status: 401 });
        this.onboardingSignal.set(state);
        this.currentUserIdSignal.set(state.userId);
        localStorage.setItem('userId', String(state.userId));
        this.currentLaboratoryIdSignal.set(state.laboratoryId);
        this.onboardingCheckedAt = Date.now();
        if (state.laboratoryId === null) localStorage.removeItem('laboratoryId');
        else localStorage.setItem('laboratoryId', String(state.laboratoryId));
      }),
      catchError((error: HttpErrorResponse) => {
        if (this.currentToken() === token) {
          this.onboardingSignal.set(null);
          if (error.status === 401) this.clearSession();
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (this.onboardingRequest === request) this.onboardingRequest = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.onboardingRequest = request;
    return request;
  }

  /** Forgets the onboarding state, so the next guard reads it again (e.g. after a step was completed). */
  invalidateOnboarding(): void {
    this.onboardingCheckedAt = 0;
    this.onboardingSignal.set(null);
  }

  /**
   * Returns the laboratory of the signed-in user, for the bounded contexts that work inside one.
   *
   * @returns Numeric id of the laboratory
   * @throws Error if the laboratory has not been set up
   */
  requireLaboratoryId(): number {
    const id = this.currentLaboratoryId();
    if (!id || !Number.isSafeInteger(id) || id <= 0) throw new Error('Laboratory setup is required');
    return id;
  }

  /**
   * Returns the id of the signed-in user.
   *
   * @returns Numeric id of the user
   * @throws Error if there is no session
   */
  requireUserId(): number {
    const id = this.currentUserId();
    if (!id || !Number.isSafeInteger(id) || id <= 0) throw new Error('Authentication is required');
    return id;
  }

  /** Ends the session without navigating, e.g. when the platform answers 401 to a request. */
  expireSession(): void {
    this.clearSession();
  }

  /**
   * Converts the sign-in command into the request body.
   *
   * @param command - Username and password
   * @returns Body of the sign-in request
   */
  private toSignInRequest(command: SignInCommand): SignInRequest {
    return {
      username: command.username,
      password: command.password,
    };
  }

  /**
   * Converts the sign-up command into the request body, trimming the e-mail.
   *
   * @param command - Data of the new account
   * @returns Body of the sign-up request
   */
  private toSignUpRequest(command: SignUpCommand): SignUpRequest {
    return {
      username: command.username,
      email: command.email.trim(),
      password: command.password,
      roles: command.roles,
      laboratoryId: command.laboratoryId,
    };
  }

  /** Keeps the session of an authenticated user in the store and in the browser. */
  private storeSession(resource: SignInResource): void {
    localStorage.setItem('token', resource.token);
    this.tokenSignal.set(resource.token);
    localStorage.setItem('userId', resource.id.toString());
    localStorage.setItem('username', resource.username);
    localStorage.setItem('roles', JSON.stringify(resource.roles));

    if (resource.laboratoryId !== null && resource.laboratoryId !== undefined) {
      localStorage.setItem('laboratoryId', resource.laboratoryId.toString());
      this.currentLaboratoryIdSignal.set(resource.laboratoryId);
    } else {
      localStorage.removeItem('laboratoryId');
      this.currentLaboratoryIdSignal.set(null);
    }

    this.isSignedInSignal.set(true);
    this.currentUsernameSignal.set(resource.username);
    this.currentUserIdSignal.set(resource.id);
    this.currentRolesSignal.set(resource.roles);
  }

  /**
   * Restores the session saved in the browser.
   *
   * @remarks
   * The session is discarded if the user id is not valid, the JWT has expired (its `exp` claim) or the roles are
   * corrupted. The laboratory is not restored: the next onboarding check reads it from the platform.
   */
  private restoreSession(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const roles = localStorage.getItem('roles');

    if (!token || !userId || !Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
      this.clearSession();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
        this.clearSession();
        return;
      }
      const parsedRoles: unknown = roles ? JSON.parse(roles) : [];
      if (!Array.isArray(parsedRoles) || parsedRoles.some((role) => typeof role !== 'string')) {
        this.clearSession();
        return;
      }
      this.currentRolesSignal.set(parsedRoles);
    } catch {
      this.clearSession();
      return;
    }
    this.tokenSignal.set(token);
    this.isSignedInSignal.set(true);
    this.currentUserIdSignal.set(Number(userId));
    this.currentUsernameSignal.set(username);
    this.currentLaboratoryIdSignal.set(null);
  }

  /** Forgets the session in the store and in the browser. */
  private clearSession(): void {
    this.tokenSignal.set(null);
    this.onboardingSignal.set(null);
    this.onboardingCheckedAt = 0;
    this.onboardingRequest = undefined;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('laboratoryId');

    this.isSignedInSignal.set(false);
    this.currentUsernameSignal.set(null);
    this.currentUserIdSignal.set(null);
    this.currentLaboratoryIdSignal.set(null);
    this.currentRolesSignal.set([]);
    this.usersSignal.set([]);
  }

  /** Marks a request as running and clears the previous error. */
  private startRequest(): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);
  }

  /** Marks the running request as finished. */
  private finishRequest(): void {
    this._loadingSignal.set(false);
  }

  /**
   * Marks the running request as failed.
   *
   * @param message - Translation key of the error
   */
  private failRequest(message: string): void {
    this._errorSignal.set(message);
    this._loadingSignal.set(false);
  }
}
