import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';
import { ContainerAssignmentForm } from './container-assignment-form';

const receipt = (changes: Partial<ConstructorParameters<typeof RawMaterialBatch>[0]> = {}) => new RawMaterialBatch({
  id: 11, laboratoryId: 1, rawMaterialId: 2, supplier: 'Andino', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 100, availableAmount: 40,
  receivedOn: '2026-09-01', expiresOn: '2028-01-01', status: 'RELEASED', ...changes,
});

describe('ContainerAssignmentForm', () => {
  const open = (containers: StorageContainer[]) => {
    TestBed.configureTestingModule({ imports: [ContainerAssignmentForm], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(ContainerAssignmentForm);
    fixture.componentRef.setInput('receipt', receipt());
    fixture.componentRef.setInput('form', new FormGroup({ containerMonitorId: new FormControl<number | null>(null) }));
    fixture.componentRef.setInput('containers', containers);
    fixture.detectChanges();
    return fixture;
  };

  it('asks for a container when there are some', () => {
    const element = open([new StorageContainer({ id: 24, name: 'CF-01', serialNumber: 'SN', status: 'OPERATIONAL', environmentId: 1 })]).nativeElement as HTMLElement;
    expect(element.querySelector('mat-select')).not.toBeNull();
    expect(element.querySelector('a[href="/equipments"]')).toBeNull();
  });

  it('explains there are none and links to the equipment', () => {
    const fixture = open([]);
    const element = fixture.nativeElement as HTMLElement;
    const cancelled = vi.fn();
    fixture.componentInstance.cancelRequested.subscribe(cancelled);
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('.notice')?.textContent).toBe('inventory.noContainers');
    expect(element.querySelector('a[href="/equipments"]')).not.toBeNull();
    (element.querySelector('button') as HTMLButtonElement).click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
