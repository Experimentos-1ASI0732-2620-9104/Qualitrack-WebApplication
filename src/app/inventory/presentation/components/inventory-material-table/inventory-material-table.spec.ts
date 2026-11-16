import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterial, StockStatus } from '../../../domain/model/raw-material.entity';
import { InventoryMaterialTable } from './inventory-material-table';

const material = (id: number, stockStatus: StockStatus) => new RawMaterial({
  id, laboratoryId: 1, environmentId: 1, code: `RM-${id}`, name: `Material ${id}`, unit: 'kg', minimumStock: 20, usableStock: 15, physicalStock: 60, stockStatus, legacyId: null,
});

describe('InventoryMaterialTable', () => {
  const open = (materials: RawMaterial[]) => {
    TestBed.configureTestingModule({ imports: [InventoryMaterialTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(InventoryMaterialTable);
    fixture.componentRef.setInput('materials', materials);
    fixture.componentRef.setInput('environmentId', 3);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('links each material to its detail in the environment', () => {
    const element = open([material(2, 'LOW')]);
    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe('/inventory/environments/3/raw-materials/2');
  });

  it('marks only the materials with low usable stock', () => {
    const element = open([material(2, 'LOW'), material(3, 'SUFFICIENT')]);
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0].querySelectorAll('td')[1].classList.contains('warning')).toBe(true);
    expect(rows[1].querySelectorAll('td')[1].classList.contains('warning')).toBe(false);
  });

  it('says so when there are no materials', () => {
    expect(open([]).querySelector('td[colspan="4"]')?.textContent).toBe('inventory.empty');
  });
});
