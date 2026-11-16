import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { InventoryApi } from '../../../infrastructure/inventory-api';
import { RawMaterial } from '../../../domain/model/raw-material.entity';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { InventoryCatalogue } from './inventory-catalogue';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';

describe('InventoryCatalogue', () => {
  const material = (id: number, stockStatus: 'LOW' | 'SUFFICIENT') =>
    new RawMaterial({
      id,
      laboratoryId: 7,
      environmentId: 1,
      code: `RM-${id}`,
      name: `Material ${id}`,
      unit: 'kg',
      minimumStock: 20,
      usableStock: stockStatus === 'LOW' ? 5 : 50,
      physicalStock: 50,
      stockStatus,
      legacyId: null,
    });
  const lot = new RawMaterialBatch({
    id: 11,
    laboratoryId: 7,
    rawMaterialId: 1,
    supplier: 'Supplier',
    batchNumber: 'SUP-1',
    unit: 'kg',
    initialAmount: 20,
    availableAmount: 20,
    receivedOn: '2026-09-01',
    expiresOn: '2026-11-20',
    status: 'RELEASED',
  });
  let lowStock: () => Observable<RawMaterial[]>;
  let nearExpiry: () => Observable<RawMaterialBatch[]>;
  const api = {
    environments: vi.fn(() => of([])),
    materials: vi.fn((_lab: number, _environmentId: number, stockStatus?: string) =>
      stockStatus === 'LOW' ? lowStock() : of([material(1, 'LOW'), material(2, 'SUFFICIENT')]),
    ),
    environmentReceipts: vi.fn(() => nearExpiry()),
  };

  beforeEach(() => {
    lowStock = () => of([material(1, 'LOW')]);
    nearExpiry = () => of([lot]);
    api.materials.mockClear();
    api.environmentReceipts.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([
          {
            path: 'inventory/environments/:environmentId/raw-materials',
            component: InventoryCatalogue,
          },
        ]),
        {
          provide: MAT_TABS_CONFIG,
          useValue: { animationDuration: '0ms' },
        },
        { provide: InventoryApi, useValue: api },
        {
          provide: IamStore,
          useValue: {
            requireLaboratoryId: () => 7,
            canManageQuality: signal(false),
            canOperate: signal(true),
          },
        },
      ],
    });
  });

  async function open() {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inventory/environments/1/raw-materials', InventoryCatalogue);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { harness, element: harness.routeNativeElement as HTMLElement };
  }

  const rows = (element: HTMLElement) =>
    element.querySelectorAll('app-inventory-material-table tbody tr').length;
  const status = (element: HTMLElement) =>
    [...element.querySelectorAll('[role=status]')].map((item) => item.textContent?.trim());
  const lowOnly = (element: HTMLElement) =>
    [...element.querySelectorAll<HTMLButtonElement>('app-filter-chip button')].find((chip) =>
      chip.textContent?.includes('inventory.lowStock'),
    )!;
  /**
   * Returns the tab of the heading for near-expiry batches.
   */
  const nearExpiryTab = (element: HTMLElement): HTMLElement => {
    const tab = [...element.querySelectorAll<HTMLElement>('[role="tab"]')].find((item) =>
      item.textContent?.includes('inventory.nearExpiry'),
    );
    if (!tab) {throw new Error('Near-expiry tab not found');}
    return tab;
  };
  const lowStockRequests = () =>
    api.materials.mock.calls.filter(([, , stockStatus]) => stockStatus === 'LOW').length;

  it('says it is loading, instead of that nothing matches, until the low stock arrives', async () => {
    const answer = new Subject<RawMaterial[]>();
    lowStock = () => answer;
    const { harness, element } = await open();
    expect(rows(element)).toBe(2);

    lowOnly(element).click();
    harness.detectChanges();

    expect(lowOnly(element).getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('app-inventory-material-table')).toBeNull();
    expect(status(element)).toContain('inventory.loading');
    answer.next([material(1, 'LOW')]);
    answer.complete();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(rows(element)).toBe(1);
    expect(element.textContent).toContain('Material 1');
    expect(element.textContent).not.toContain('Material 2');
  });


  it('says the lots near expiry are loading until they arrive', async () => {
    const answer = new Subject<RawMaterialBatch[]>();
    nearExpiry = () => answer;

    const { harness, element } = await open();
    // Select the near-expiry tab.
    nearExpiryTab(element).click();
    harness.detectChanges();
    // Allow Angular Material to initialize the lazy tab content.
    await harness.fixture.whenStable();
    harness.detectChanges();
    // Verify that the request has started.
    expect(api.environmentReceipts).toHaveBeenCalledTimes(1);
    // Allow the active tab's content to finish rendering.
    await harness.fixture.whenStable();
    harness.detectChanges();
    // Verify that the loading message is displayed
    // while the response is pending.
    const activeTab = element.querySelector('mat-tab-nav-panel');
    expect(activeTab).not.toBeNull();
    expect(activeTab?.querySelector('app-near-expiry-table')).toBeNull();
    expect(activeTab?.querySelector('[role="status"]')?.textContent?.trim()).toContain(
      'inventory.loading',
    );
    // Complete the pending request.
    answer.next([lot]);
    answer.complete();
    await harness.fixture.whenStable();
    harness.detectChanges();
    // Verify that the received batch is displayed.
    expect(element.querySelector('app-near-expiry-table')?.textContent).toContain('SUP-1');
  });

  it('asks again for the low stock and the lots near expiry shown when it reloads', async () => {
    const { harness, element } = await open();
    // Enable the low-stock filter.
    lowOnly(element).click();
    harness.detectChanges();
    // Select the near-expiry tab.
    nearExpiryTab(element).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    // Verify the initial requests.
    expect(lowStockRequests()).toBe(1);
    expect(api.environmentReceipts).toHaveBeenCalledTimes(1);
    // Reload the current inventory.
    await harness.routeDebugElement!.componentInstance.reload();
    // Both active requests should execute again.
    expect(lowStockRequests()).toBe(2);
    expect(api.environmentReceipts).toHaveBeenCalledTimes(2);
  });


  it('does not ask for the low stock or the lots near expiry when they are not shown', async () => {
    const { harness } = await open();

    await harness.routeDebugElement!.componentInstance.reload();

    expect(api.materials).toHaveBeenCalledTimes(2);
    expect(lowStockRequests()).toBe(0);
    expect(api.environmentReceipts).not.toHaveBeenCalled();
  });
});
