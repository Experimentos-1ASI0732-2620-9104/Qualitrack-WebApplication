import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LegacyMaterial } from '../../../domain/model/legacy-material.entity';
import { LegacyImportPanel } from './legacy-import-panel';

const legacy = new LegacyMaterial({ id: 5, code: 'OLD-01', name: 'Historical material', unit: 'kg', balance: 4, supplier: 'Andino', batchNumber: 'OLD', expiresOn: '2027-01-01' });

describe('LegacyImportPanel', () => {
  const open = (materials: LegacyMaterial[], saving = false) => {
    TestBed.configureTestingModule({ imports: [LegacyImportPanel], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(LegacyImportPanel);
    fixture.componentRef.setInput('materials', materials);
    fixture.componentRef.setInput('saving', saving);
    fixture.detectChanges();
    return fixture;
  };

  it('tells which material the user wants to import', () => {
    const fixture = open([legacy]);
    const imported: number[] = [];
    fixture.componentInstance.importRequested.subscribe((id) => imported.push(id));
    ((fixture.nativeElement as HTMLElement).querySelector('.legacy-row button') as HTMLButtonElement).click();
    expect(imported).toEqual([5]);
  });

  it('blocks the import while saving', () => {
    expect(((open([legacy], true).nativeElement as HTMLElement).querySelector('.legacy-row button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('says so when there is nothing to import', () => {
    const element = open([]).nativeElement as HTMLElement;
    expect(element.querySelector('.legacy-row')).toBeNull();
    expect(element.textContent).toContain('inventory.noLegacy');
  });
});
