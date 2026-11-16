import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IamStore } from '../../../application/iam.store';
import { ResetPasswordCommand } from '../../../domain/model/reset-password.command';
import { PasswordRecoveryApiEndpoint } from '../../../infrastructure/password-recovery-api-endpoint';
import { PasswordRecovery } from './password-recovery';

describe('PasswordRecovery error messages', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [PasswordRecovery], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService(),
      { provide: IamStore, useFactory: () => {
        const endpoint = new PasswordRecoveryApiEndpoint(TestBed.inject(HttpClient));
        return { isSignedIn: () => false, requestPasswordRecovery: (account: string) => endpoint.requestRecovery({ account }).pipe(map(r => r.codeValidityMinutes)),
          resetPassword: (command: ResetPasswordCommand) => endpoint.resetPassword(command).pipe(map(r => r.username)) };
      } },
    ] });
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); });
  it.each([
    ['request', 0, 'onboarding.connection-error'], ['request', 500, 'iam.password-recovery.errors.request'],
    ['reset', 0, 'onboarding.connection-error'], ['reset', 400, 'iam.password-recovery.errors.invalid-code'], ['reset', 500, 'iam.password-recovery.errors.reset'],
  ])('keeps the visible message for %s HTTP %s', (step, status, key) => {
    const fixture = TestBed.createComponent(PasswordRecovery); fixture.detectChanges(); const component = fixture.componentInstance;
    component['accountForm'].setValue({ account: 'test-account' });
    if (step === 'request') component['requestCode']();
    else {
      component['resetForm'].setValue({ code: '123456', newPassword: 'FixtureOnly123', confirmPassword: 'FixtureOnly123' });
      component['resetPassword']();
    }
    const pending = TestBed.inject(HttpTestingController).expectOne(r => r.method === 'POST');
    if (status === 0) pending.error(new ProgressEvent('error'));
    else pending.flush({}, { status: status as number, statusText: 'Failure' });
    fixture.detectChanges(); expect(component['error']()).toBe(key); expect(fixture.nativeElement.textContent).toContain(key);
  });
});
