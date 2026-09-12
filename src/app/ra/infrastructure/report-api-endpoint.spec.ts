import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReportApiEndpoint } from './report-api-endpoint';

describe('ReportApiEndpoint binary responses', () => {
  let endpoint: ReportApiEndpoint;
  let http: HttpTestingController;
  const command = { batchId: 47, includeTelemetry: false, includeDeviations: true, format: 'PDF' as const, requestedBy: 27 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    endpoint = new ReportApiEndpoint(TestBed.inject(HttpClient));
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserves successful PDF bytes and sends the selected numeric ID', async () => {
    const pending = firstValueFrom(endpoint.generateBatchReport(command));
    const request = http.expectOne(request => request.url.endsWith('/batches/47/reports'));
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual({ includeTelemetry: false, includeDeviations: true, format: 'PDF', requestedBy: 27 });
    const file = new Blob(['%PDF-test-binary'], { type: 'application/pdf' });
    request.flush(file);
    expect(await pending).toBe(file);
  });

  for (const status of [403, 404]) {
    it(`explains an unavailable resource for HTTP ${status}, even with a JSON Blob`, async () => {
      const pending = firstValueFrom(endpoint.generateBatchReport(command)).catch(error => error);
      const request = http.expectOne(request => request.url.endsWith('/batches/47/reports'));
      request.flush(new Blob(['{"message":"Resource is not available to this account"}'], { type: 'application/json' }),
        { status, statusText: 'Unavailable' });
      const error = await pending;
      expect(error.message).toBe('report-generator.errors.resource-unavailable');
      expect(error.cause).toBeInstanceOf(HttpErrorResponse);
      expect(error.cause.status).toBe(status);
    });
  }

  it('distinguishes expired authentication from a generation failure', async () => {
    const pending = firstValueFrom(endpoint.generateBatchReport(command)).catch(error => error);
    http.expectOne(request => request.url.endsWith('/batches/47/reports'))
      .flush(new Blob(), { status: 401, statusText: 'Unauthorized' });
    expect((await pending).message).toBe('report-generator.errors.session-expired');
  });
});
