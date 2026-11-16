import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { MaterialConsumptionApiEndpoint } from './material-consumption-api-endpoint';

describe('MaterialConsumptionApiEndpoint', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('reads current consumption through the unchanged environment-scoped resource', () => {
    const endpoint = new MaterialConsumptionApiEndpoint(TestBed.inject(HttpClient));
    const next = vi.fn(); endpoint.getByEnvironmentMaterial(7, 3, 2).subscribe(next);
    const request = TestBed.inject(HttpTestingController).expectOne(environment.serverBasePath + '/laboratories/7/environments/3/raw-materials/2/usages');
    expect(request.request.method).toBe('GET'); request.flush([]); expect(next).toHaveBeenCalledWith([]);
  });
  it('reads legacy history through the unchanged laboratory-scoped resource', () => {
    const endpoint = new MaterialConsumptionApiEndpoint(TestBed.inject(HttpClient));
    const next = vi.fn(); endpoint.getByLegacyMaterial(7, 2).subscribe(next);
    const request = TestBed.inject(HttpTestingController).expectOne(environment.serverBasePath + '/laboratories/7/raw-materials/2/usages');
    expect(request.request.method).toBe('GET'); request.flush([]); expect(next).toHaveBeenCalledWith([]);
  });
});
