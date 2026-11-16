import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LegacyInventoryApiEndpoint } from './legacy-inventory-api-endpoint';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { environment } from '../../../environments/environment';

describe('LegacyInventoryApiEndpoint', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('returns previous balances as domain entities without changing import eligibility data', () => {
    const next = vi.fn(); new LegacyInventoryApiEndpoint(TestBed.inject(HttpClient)).pending(1).subscribe(next);
    const resource = { id: 3, code: 'OLD-3', name: 'Material', unit: 'kg', balance: 0, supplier: 'Supplier', batchNumber: 'OLD-LOT', expiresOn: '2027-01-01' };
    TestBed.inject(HttpTestingController).expectOne(environment.serverBasePath + '/laboratories/1/inventory/legacy-materials').flush([resource]);
    expect(next.mock.calls[0][0][0]).toBeInstanceOf(LegacyMaterial);
    expect(next).toHaveBeenCalledWith([resource]);
  });
});
