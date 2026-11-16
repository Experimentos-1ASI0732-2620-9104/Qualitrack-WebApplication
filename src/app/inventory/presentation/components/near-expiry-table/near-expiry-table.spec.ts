import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { NearExpiryTable } from './near-expiry-table';

const receipt = (changes: Partial<ConstructorParameters<typeof RawMaterialBatch>[0]> = {}) => new RawMaterialBatch({
  id: 11, laboratoryId: 1, rawMaterialId: 2, supplier: 'Andino', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 100, availableAmount: 40,
  receivedOn: '2026-09-01', expiresOn: '2028-01-01', status: 'RELEASED', ...changes,
});

describe('NearExpiryTable', () => {
  const open = (batches: RawMaterialBatch[]) => {
    TestBed.configureTestingModule({ imports: [NearExpiryTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(NearExpiryTable);
    fixture.componentRef.setInput('batches', batches);
    fixture.componentRef.setInput('materialNames', new Map([[2, 'Lactosa']]));
    fixture.componentRef.setInput('environmentId', 3);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('names the material of each lot and shows the identifier of an unknown one', () => {
    const links = open([receipt(), receipt({ id: 12, rawMaterialId: 77 })]).querySelectorAll('tbody a');
    expect(links[0].textContent?.trim()).toBe('Lactosa');
    expect(links[0].getAttribute('href')).toBe('/inventory/environments/3/raw-materials/2');
    expect(links[1].textContent?.trim()).toBe('#77');
  });

  it('says so when no lot is close to expire', () => {
    expect(open([]).querySelector('td[colspan="4"]')?.textContent).toBe('inventory.nearExpiryEmpty');
  });
});
