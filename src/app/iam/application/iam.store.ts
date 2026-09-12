import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, of, shareReplay, tap, throwError } from 'rxjs';
import { OnboardingState } from '../domain/model/onboarding-state';

import { User } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { RecoverPasswordCommand } from '../domain/model/recover-password.command';

import { IamApi } from '../infrastructure/iam-api';
import { SignInRequest } from '../infrastructure/sign-in.request';
import { SignUpRequest } from '../infrastructure/sign-up.request';
import { RecoverPasswordRequest } from '../infrastructure/recover-password.request';

/**
 * Signal-based application store for Identity and Access Management.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly _loadingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);
  private readonly isSignedInSignal = signal<boolean>(false);
  private readonly currentUsernameSignal = signal<string | null>(null);
  private readonly currentUserIdSignal = signal<number | null>(null);
  private readonly currentLaboratoryIdSignal = signal<number | null>(null);
  private readonly currentRolesSignal = signal<string[]>([]);
  private readonly tokenSignal = signal<string | null>(null);
  private readonly onboardingSignal = signal<OnboardingState | null>(null);
  private onboardingRequest?: Observable<OnboardingState>;
  private onboardingCheckedAt = 0;
  readonly onboarding = this.onboardingSignal.asReadonly();
  private readonly usersSignal = signal<User[]>([]);
  private readonly loadingUsers = signal<boolean>(false);

  readonly isSignedIn = this.isSignedInSignal.asReadonly();
  readonly currentUsername = this.currentUsernameSignal.asReadonly();
  readonly currentUserId = this.currentUserIdSignal.asReadonly();
  readonly currentLaboratoryId = this.currentLaboratoryIdSignal.asReadonly();
  readonly currentRoles = this.currentRolesSignal.asReadonly();
  readonly currentToken = this.tokenSignal.asReadonly();
  readonly users = this.usersSignal.asReadonly();
  readonly loading = this._loadingSignal.asReadonly();
  readonly error = this._errorSignal.asReadonly();
  readonly isLoadingUsers = this.loadingUsers.asReadonly();

  readonly currentPrimaryRole = computed(() => {
    const role = this.currentRoles()[0];

    if (!role) return null;

    return role
      .replace('ROLE_', '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  });

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

  constructor(private readonly iamApi: IamApi) {
    this.restoreSession();
  }

  recoverPassword(command: RecoverPasswordCommand, router: Router): void {
    this.startRequest();

    const request = this.toRecoverPasswordRequest(command);

    this.iamApi.recoverPassword(request).subscribe({
      next: () => {
        this.finishRequest();
        router.navigate(['/iam/sign-in']).then();
      },
      error: () => {
        this.failRequest('Failed to request password recovery.');
      },
    });
  }

  signIn(command: SignInCommand, router: Router): void {
    this.clearSession();
    this.startRequest();

    const request = this.toSignInRequest(command);

    this.iamApi.signIn(request).subscribe({
      next: (resource) => {
        this._errorSignal.set(null);

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
      error: () => {
        this.clearSession();
        this.failRequest('onboarding.sign-up-error');
      },
    });
  }

  signOut(router: Router): void {
    this.clearSession();
    router.navigate(['/home']).then();
  }

  clearError(): void {
    this._errorSignal.set(null);
  }

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

  invalidateOnboarding(): void {
    this.onboardingCheckedAt = 0;
    this.onboardingSignal.set(null);
  }

  requireLaboratoryId(): number {
    const id = this.currentLaboratoryId();
    if (!id || !Number.isSafeInteger(id) || id <= 0) throw new Error('Laboratory setup is required');
    return id;
  }

  requireUserId(): number {
    const id = this.currentUserId();
    if (!id || !Number.isSafeInteger(id) || id <= 0) throw new Error('Authentication is required');
    return id;
  }

  expireSession(): void {
    this.clearSession();
  }

  private toSignInRequest(command: SignInCommand): SignInRequest {
    return {
      username: command.username,
      password: command.password,
    };
  }

  private toSignUpRequest(command: SignUpCommand): SignUpRequest {
    return {
      username: command.username,
      password: command.password,
      roles: command.roles,
      laboratoryId: command.laboratoryId,
    };
  }

  private toRecoverPasswordRequest(command: RecoverPasswordCommand): RecoverPasswordRequest {
    return {
      username: command.username,
    };
  }

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

  private startRequest(): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);
  }

  private finishRequest(): void {
    this._loadingSignal.set(false);
  }

  private failRequest(message: string): void {
    this._errorSignal.set(message);
    this._loadingSignal.set(false);
  }
}
