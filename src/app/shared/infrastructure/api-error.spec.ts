import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, errorStatus } from './api-error';

describe('errorStatus', () => {
  it('reads the status of the errors of the API endpoints', () => {
    expect(errorStatus(new ApiError('Conflict', 409))).toBe(409);
  });

  it('reads the status of the HTTP errors, 0 when the server could not be reached', () => {
    expect(errorStatus(new HttpErrorResponse({ status: 400 }))).toBe(400);
    expect(errorStatus(new HttpErrorResponse({ status: 0 }))).toBe(0);
  });

  it('returns null for errors that did not come from a request', () => {
    expect(errorStatus(new Error('Unexpected'))).toBeNull();
    expect(errorStatus(undefined)).toBeNull();
  });
});
