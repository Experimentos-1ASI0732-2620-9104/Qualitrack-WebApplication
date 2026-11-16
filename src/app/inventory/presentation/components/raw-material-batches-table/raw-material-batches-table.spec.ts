import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';
import { RawMaterialBatchesTable } from './raw-material-batches-table';

const receipt = (changes: Partial<ConstructorParameters<typeof RawMaterialBatch>[0]> = {}) => new RawMaterialBatch({
  id: 11, laboratoryId: 1, rawMaterialId: 2, supplier: 'Andino', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 100, availableAmount: 40,
  receivedOn: '2026-09-01', expiresOn: '2028-01-01', status: 'RELEASED', ...changes,
});

const container = new StorageContainer({ id: 24, name: 'Refrigerador CF-01', serialNumber: 'SN-24', status: 'OPERATIONAL', environmentId: 1 });

describe('RawMaterialBatchesTable', () => {
  const open = (inputs: Record<string, unknown>) => {
    TestBed.configureTestingModule({ imports: [RawMaterialBatchesTable], providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(RawMaterialBatchesTable);
    fixture.componentRef.setInput('containers', [container]);
    fixture.componentRef.setInput('environmentId', 1);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture;
  };
  const icon = (element: HTMLElement, name: string) =>
    [...element.querySelectorAll('button')].filter((button) => button.textContent?.includes(name));

  it('names the container of a reception and shows the identifier of an unknown one', () => {
    const element = open({ receipts: [receipt({ containerMonitorId: 24 }), receipt({ id: 12, containerMonitorId: 99 })] }).nativeElement as HTMLElement;
    const cells = element.querySelectorAll('tbody tr td:nth-child(5) strong');
    expect(cells[0].textContent).toBe('Refrigerador CF-01');
    expect(cells[1].textContent).toBe('#99');
  });

  it('offers storing only to who operates an environment that keeps lots in containers', () => {
    const receipts = [receipt()];
    expect(icon(open({ receipts, canOperate: true, storesInContainers: true }).nativeElement, 'inventory').length).toBe(1);
    TestBed.resetTestingModule();
    expect(icon(open({ receipts, canOperate: true, storesInContainers: false }).nativeElement, 'inventory').length).toBe(0);
    TestBed.resetTestingModule();
    expect(icon(open({ receipts, canOperate: false, storesInContainers: true }).nativeElement, 'inventory').length).toBe(0);
  });

  it('offers the review to who decides on quality, except on a rejected reception', () => {
    const element = open({ receipts: [receipt(), receipt({ id: 12, status: 'REJECTED' })], canReview: true }).nativeElement as HTMLElement;
    expect(icon(element, 'fact_check').length).toBe(1);
  });

  it('tells which reception the user wants to review or store', () => {
    const fixture = open({ receipts: [receipt()], canReview: true, canOperate: true, storesInContainers: true });
    const reviewed: RawMaterialBatch[] = [];
    const stored: RawMaterialBatch[] = [];
    fixture.componentInstance.reviewRequested.subscribe((item) => reviewed.push(item));
    fixture.componentInstance.storageRequested.subscribe((item) => stored.push(item));
    const element = fixture.nativeElement as HTMLElement;
    icon(element, 'fact_check')[0].click();
    icon(element, 'inventory')[0].click();
    expect(reviewed[0].id).toBe(11);
    expect(stored[0].id).toBe(11);
  });

  it('says so when there are no receptions', () => {
    const element = open({ receipts: [] }).nativeElement as HTMLElement;
    expect(element.querySelector('td[colspan="6"]')?.textContent).toBe('inventory.noReceipts');
  });
});
