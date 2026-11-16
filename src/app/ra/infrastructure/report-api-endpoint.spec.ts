import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { throwError } from 'rxjs';
import { ApiError } from '../../shared/infrastructure/api-error';
import { ReportApiEndpoint } from './report-api-endpoint';
import { environment } from '../../../environments/environment';

describe('ReportApiEndpoint', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); });
  const request = { batchId: 4, includeDeviations: true, format: 'PDF' as const };
  it('downloads the original Blob after creating the report', () => {
    const next = vi.fn(); new ReportApiEndpoint(TestBed.inject(HttpClient)).generateBatchReport(request).subscribe(next);
    const http = TestBed.inject(HttpTestingController);
    const create = http.expectOne(environment.serverBasePath + '/batches/4/reports');
    expect(create.request.method).toBe('POST'); expect(create.request.body).toEqual({ includeDeviations: true, format: 'PDF' });
    create.flush({ id: 7 });
    const download = http.expectOne(environment.serverBasePath + '/reports/7/content');
    expect(download.request.responseType).toBe('blob');
    const blob = new Blob(['pdf-content'], { type: 'application/pdf' }); download.flush(blob);
    expect(next).toHaveBeenCalledWith(blob);
  });
  for (const phase of ['creation', 'download'] as const) {
    it.each([
      [0, 'connection'], [400, 'invalid-request'], [401, 'session-expired'],
      [403, 'resource-unavailable'], [404, 'resource-unavailable'], [500, 'batch'],
    ])('preserves the ' + phase + ' error message for HTTP %s', (status, key) => {
      const error = vi.fn(); new ReportApiEndpoint(TestBed.inject(HttpClient)).generateBatchReport(request).subscribe({ error });
      const http = TestBed.inject(HttpTestingController);
      let pending = http.expectOne(environment.serverBasePath + '/batches/4/reports');
      if (phase === 'download') { pending.flush({ id: 7 }); pending = http.expectOne(environment.serverBasePath + '/reports/7/content'); }
      if (status === 0) pending.error(new ProgressEvent('error'));
      else pending.flush(phase === 'download' ? new Blob(['{"message":"Server detail"}'], { type: 'application/json' }) : { message: 'Server detail' }, { status, statusText: 'Failure' });
      const result = error.mock.calls[0][0];
      expect(result.message).toBe('report-generator.errors.' + key);
      expect(result.cause).toBeInstanceOf(ApiError); expect(result.cause.status).toBe(status);
    });
  }
  it('keeps the report-specific fallback for non-HTTP failures', () => {
    const original = new Error('Unexpected failure');
    const http = { post: () => throwError(() => original) } as unknown as HttpClient;
    const error = vi.fn(); new ReportApiEndpoint(http).generateBatchReport(request).subscribe({ error });
    expect(error.mock.calls[0][0].message).toBe('report-generator.errors.batch');
    expect(error.mock.calls[0][0].cause).toBe(original);
  });
});
