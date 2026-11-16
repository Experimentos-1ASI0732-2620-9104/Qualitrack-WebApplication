import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiError, errorStatus } from '../../shared/infrastructure/api-error';
import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint';

describe('PasswordRecoveryApiEndpoint', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); });
  it.each([0, 400, 500])('preserves HTTP %s for the password recovery view', (status) => {
    const endpoint = new PasswordRecoveryApiEndpoint(TestBed.inject(HttpClient)); const error = vi.fn();
    endpoint.requestRecovery({ account: 'test-account' }).subscribe({ error });
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/authentication/password-recovery-requests'));
    expect(request.request.body).toEqual({ account: 'test-account' });
    if (status === 0) request.error(new ProgressEvent('error'));
    else request.flush({ message: 'Server detail' }, { status, statusText: 'Failure' });
    expect(error.mock.calls[0][0]).toBeInstanceOf(ApiError); expect(errorStatus(error.mock.calls[0][0])).toBe(status);
  });
  it('retains the invalid-code status and server details after a reset failure', () => {
    const endpoint = new PasswordRecoveryApiEndpoint(TestBed.inject(HttpClient)); const error = vi.fn();
    endpoint.resetPassword({ account: 'test-account', code: '123456', newPassword: 'FixtureOnly123' }).subscribe({ error });
    TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/authentication/password-resets')).flush({ message: 'Invalid or expired code' }, { status: 400, statusText: 'Bad Request' });
    expect(errorStatus(error.mock.calls[0][0])).toBe(400);
    expect(error.mock.calls[0][0].details).toBe('Invalid or expired code');
  });
});
