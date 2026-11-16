import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterial } from '../../../domain/model/raw-material.entity';
import { InventorySummary } from './inventory-summary';

describe('InventorySummary', () => {
  it('shows the usable, physical and minimum stock with their unit', () => {
    TestBed.configureTestingModule({ imports: [InventorySummary], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(InventorySummary);
    fixture.componentRef.setInput('material', new RawMaterial({
      id: 2, laboratoryId: 1, environmentId: 1, code: 'RM-001', name: 'Lactosa', unit: 'kg', minimumStock: 20, usableStock: 15.5, physicalStock: 60, stockStatus: 'LOW', legacyId: null,
    }));
    fixture.detectChanges();
    const values = [...(fixture.nativeElement as HTMLElement).querySelectorAll('strong')].map((item) => item.textContent);
    expect(values).toEqual(['15.5 kg', '60 kg', '20 kg']);
  });
});
