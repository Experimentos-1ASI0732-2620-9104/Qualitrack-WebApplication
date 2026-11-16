import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LegacyMaterialSnapshot } from '../../../domain/model/legacy-material-snapshot.entity';
import { LegacyMaterialSummary } from './legacy-material-summary';

describe('LegacyMaterialSummary', () => {
  const open = (quantityInStock: number) => {
    TestBed.configureTestingModule({ imports: [LegacyMaterialSummary], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(LegacyMaterialSummary);
    fixture.componentRef.setInput('material', new LegacyMaterialSnapshot({
      id: 3, name: 'Historical material', code: 'OLD-3', supplier: 'Supplier', batchNumber: 'OLD', expirationDate: '2027-01-01', quantityInStock, unit: 'kg', minimumStock: 10,
    }));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('warns when the stock does not exceed the minimum', () => {
    const element = open(10);
    expect(element.querySelector('.stock-total strong')?.classList.contains('low')).toBe(true);
    expect(element.querySelector('.warning')?.textContent).toBe('raw-material-list.lowStock');
  });

  it('does not warn when there is enough stock', () => {
    const element = open(11);
    expect(element.querySelector('.stock-total strong')?.textContent).toContain('11 kg');
    expect(element.querySelector('.warning')).toBeNull();
  });
});
