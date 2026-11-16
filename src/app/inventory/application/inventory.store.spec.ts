import { of, Subject, throwError } from 'rxjs';
import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
import { TestBed } from '@angular/core/testing';
import { IamStore } from '../../iam/application/iam.store';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterialBatch, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';
import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { InventoryStore } from './inventory.store';

describe('InventoryStore affected batches', () => {
  const receipt = (id: number, status: RawMaterialBatchStatus) => new RawMaterialBatch({
    id, status, laboratoryId: 1, rawMaterialId: 1, supplier: 'Supplier', batchNumber: String(id), unit: 'kg', initialAmount: 20, availableAmount: 10, receivedOn: '2026-10-01', expiresOn: '2027-10-01',
  });
  const usage = (id: number, batchId: number, inventoryReceiptId: number | null) => new MaterialConsumption({
    id, batchId, inventoryReceiptId, quantityUsed: 1, unit: 'kg', usageDate: '2026-10-02',
  });
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    { provide: InventoryApi, useValue: {} },
    { provide: IamStore, useValue: { canManageQuality: () => true, canOperate: () => true } },
  ] }));
  it('warns for observed and rejected receipts and deduplicates production batches', () => {
    const store = TestBed.inject(InventoryStore);
    store.receipts.set([receipt(1, 'OBSERVED'), receipt(2, 'REJECTED'), receipt(3, 'RELEASED')]);
    store.usages.set([usage(1, 8, 1), usage(2, 8, 2), usage(3, 9, 2), usage(4, 10, 3), usage(5, 11, null), usage(6, 12, 99)]);
    expect(store.affectedBatches()).toEqual([8, 9]);
  });
  it('removes the warning when the receipt is released and retains unlinked legacy consumption', () => {
    const store = TestBed.inject(InventoryStore);
    store.usages.set([usage(1, 8, 1), usage(2, 9, null)]);
    store.receipts.set([receipt(1, 'OBSERVED')]);
    expect(store.affectedBatches()).toEqual([8]);
    store.receipts.set([receipt(1, 'RELEASED')]);
    expect(store.affectedBatches()).toEqual([]);
    expect(store.usages().length).toBe(2);
  });
});

describe('InventoryStore legacy detail', () => {
  const material = new LegacyMaterialSnapshot({ id: 3, name: 'Legacy material', code: 'OLD-3', supplier: 'Supplier', batchNumber: 'OLD-LOT', expirationDate: '2026-09-01', quantityInStock: 0, minimumStock: 4, unit: 'kg' });
  const consumption = new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01' });
  const api = { legacyMaterialSnapshots: vi.fn(), legacyMaterialConsumptions: vi.fn(), consumingBatches: vi.fn() };
  beforeEach(() => {
    api.legacyMaterialSnapshots.mockReset().mockReturnValue(of([material]));
    api.legacyMaterialConsumptions.mockReset().mockReturnValue(of([consumption]));
    api.consumingBatches.mockReset().mockReturnValue(of([new ConsumingBatch({ id: 8, batchNumber: 'PB-8' })]));
    TestBed.configureTestingModule({ providers: [
      { provide: InventoryApi, useValue: api },
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true, canOperate: () => true } },
    ] });
  });
  it('keeps an empty material with historical consumption, labels and unrecorded balances', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    expect(store.legacyDetailMaterial()).toBe(material);
    expect(store.legacyDetailConsumptions()).toEqual([consumption]);
    expect(store.legacyDetailHasUnrecordedStock()).toBe(true);
    expect(store.legacyDetailBatches().map((batch) => batch.batchNumber)).toEqual(['PB-8']);
    expect(api.legacyMaterialConsumptions).toHaveBeenCalledWith(7, 3);
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it('discards stale responses and clears history when the page is left', () => {
    const stale = new Subject<MaterialConsumption[]>();
    api.legacyMaterialConsumptions.mockReturnValueOnce(stale);
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    store.clearLegacyDetail(); stale.next([consumption]); stale.complete();
    expect(store.legacyDetailMaterial()).toBeNull();
    expect(store.legacyDetailConsumptions()).toEqual([]);
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it('shows not found for missing historical materials', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(999);
    expect(store.legacyDetailError()).toBe('material-history.not-found');
    expect(store.legacyDetailMaterial()).toBeNull();
  });
  it('reports load failure instead of showing stale stock', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    api.legacyMaterialSnapshots.mockReturnValue(throwError(() => new Error('unavailable')));
    store.loadLegacyDetail(3);
    expect(store.legacyDetailError()).toBe('material-history.load-error');
    expect(store.legacyDetailMaterial()).toBeNull();
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it.each([0, -1, NaN, 1.5])('does not request history for invalid identifiers: %s', (id) => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(id);
    expect(api.legacyMaterialSnapshots).not.toHaveBeenCalled();
    expect(store.legacyDetailError()).toBe('material-history.not-found');
  });
});

describe('InventoryStore writes and environments', () => {
  const receipt = new RawMaterialBatch({
    id: 11, laboratoryId: 1, rawMaterialId: 2, supplier: 'Supplier', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 20, availableAmount: 20,
    receivedOn: '2026-09-01', expiresOn: '2028-01-01', status: 'QUARANTINED',
  });
  const material = new RawMaterial({
    id: 2, laboratoryId: 1, environmentId: 1, code: 'RM-001', name: 'Lactosa', unit: 'kg', minimumStock: 20, usableStock: 15, physicalStock: 60, stockStatus: 'LOW', legacyId: null,
  });
  const api = { materials: vi.fn(), review: vi.fn() };
  beforeEach(() => {
    api.materials.mockReset().mockReturnValue(of([material]));
    api.review.mockReset().mockReturnValue(of({}));
    TestBed.configureTestingModule({ providers: [
      { provide: InventoryApi, useValue: api },
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true, canOperate: () => true } },
    ] });
  });

  it('keeps the saved notice after the reload that follows a change', async () => {
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    expect(await store.review(receipt, { status: 'RELEASED', reason: 'Verified' })).toBe(true);
    expect(store.notice()).toBe('inventory.saved');
  });

  it('does not announce a change that failed', async () => {
    api.review.mockReturnValue(throwError(() => new Error('refused')));
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    expect(await store.review(receipt, { status: 'RELEASED', reason: 'Verified' })).toBe(false);
    expect(store.notice()).toBe('');
    expect(store.error()).not.toBe('');
  });

  it('forgets the data of the previous environment as soon as another one opens', async () => {
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    store.nearExpiry.set([receipt]);
    store.lowStockMaterials.set([material]);
    store.environmentUsage.set('RAW_MATERIAL_STORAGE');
    api.materials.mockReturnValue(new Subject());
    void store.load(2);
    expect(store.materials()).toEqual([]);
    expect(store.nearExpiry()).toEqual([]);
    expect(store.lowStockMaterials()).toEqual([]);
    expect(store.environmentUsage()).toBeNull();
  });

  it('keeps what is on screen while the same environment reloads', async () => {
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    api.materials.mockReturnValue(new Subject());
    void store.load(1);
    expect(store.materials()).toEqual([material]);
  });
});

describe('InventoryStore low-stock and near-expiry requests', () => {
  const material = (id: number, stockStatus: 'LOW' | 'SUFFICIENT') => new RawMaterial({
    id, laboratoryId: 7, environmentId: 1, code: `RM-${id}`, name: `Material ${id}`, unit: 'kg', minimumStock: 20,
    usableStock: stockStatus === 'LOW' ? 5 : 50, physicalStock: 50, stockStatus, legacyId: null,
  });
  const lot = new RawMaterialBatch({
    id: 11, laboratoryId: 7, rawMaterialId: 1, supplier: 'Supplier', batchNumber: 'SUP-1', unit: 'kg', initialAmount: 20, availableAmount: 20,
    receivedOn: '2026-09-01', expiresOn: '2026-11-20', status: 'RELEASED',
  });
  const api = { materials: vi.fn(), environmentReceipts: vi.fn() };
  beforeEach(() => {
    api.materials.mockReset().mockReturnValue(of([material(1, 'LOW'), material(2, 'SUFFICIENT')]));
    api.environmentReceipts.mockReset();
    TestBed.configureTestingModule({ providers: [
      { provide: InventoryApi, useValue: api },
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true, canOperate: () => true } },
    ] });
  });

  it('says the low stock is loading until its answer arrives', async () => {
    const answer = new Subject<RawMaterial[]>();
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    api.materials.mockReturnValue(answer);

    const request = store.loadLowStock();

    expect(api.materials).toHaveBeenLastCalledWith(7, 1, 'LOW');
    expect(store.lowStockLoading()).toBe(true);
    answer.next([material(1, 'LOW')]);
    answer.complete();
    await request;
    expect(store.lowStockLoading()).toBe(false);
    expect(store.lowStockMaterials().map((item) => item.id)).toEqual([1]);
  });

  it('keeps only the answer of the latest low-stock request', async () => {
    const first = new Subject<RawMaterial[]>();
    const second = new Subject<RawMaterial[]>();
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    api.materials.mockReturnValueOnce(first).mockReturnValueOnce(second);

    const older = store.loadLowStock();
    const newer = store.loadLowStock();
    first.next([material(2, 'SUFFICIENT')]);
    first.complete();
    await older;

    expect(store.lowStockMaterials()).toEqual([]);
    expect(store.lowStockLoading()).toBe(true);
    second.next([material(1, 'LOW')]);
    second.complete();
    await newer;
    expect(store.lowStockMaterials().map((item) => item.id)).toEqual([1]);
    expect(store.lowStockLoading()).toBe(false);
  });

  it('ignores a low-stock answer, or its failure, that arrives after the inventory reloads', async () => {
    const stale = new Subject<RawMaterial[]>();
    const failed = new Subject<RawMaterial[]>();
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    api.materials.mockReturnValueOnce(stale).mockReturnValueOnce(failed);
    const request = store.loadLowStock();
    const failing = store.loadLowStock();

    await store.load(1);
    stale.next([material(1, 'LOW')]);
    stale.complete();
    failed.error(new Error('unavailable'));
    await Promise.all([request, failing]);

    expect(store.lowStockMaterials()).toEqual([]);
    expect(store.lowStockLoading()).toBe(false);
    expect(store.error()).toBe('');
  });

  it('reports the failure of the latest low-stock request', async () => {
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    api.materials.mockReturnValue(throwError(() => new Error('unavailable')));

    await store.loadLowStock();

    expect(store.error()).toBe('inventory.error');
    expect(store.lowStockLoading()).toBe(false);
  });

  it('says the lots near expiry are loading until their answer arrives', async () => {
    const answer = new Subject<RawMaterialBatch[]>();
    api.environmentReceipts.mockReturnValue(answer);
    const store = TestBed.inject(InventoryStore);
    await store.load(1);

    const request = store.loadNearExpiry(30);

    expect(api.environmentReceipts).toHaveBeenCalledWith(7, 1, 'NEAR_EXPIRY', 30);
    expect(store.nearExpiryLoading()).toBe(true);
    answer.next([lot]);
    answer.complete();
    await request;
    expect(store.nearExpiry()).toEqual([lot]);
    expect(store.nearExpiryLoading()).toBe(false);
  });

  it('ignores the lots near expiry of an environment that was left', async () => {
    const stale = new Subject<RawMaterialBatch[]>();
    api.environmentReceipts.mockReturnValue(stale);
    const store = TestBed.inject(InventoryStore);
    await store.load(1);
    const request = store.loadNearExpiry();

    await store.load(2);
    stale.next([lot]);
    stale.complete();
    await request;

    expect(store.environmentId()).toBe(2);
    expect(store.nearExpiry()).toEqual([]);
    expect(store.nearExpiryLoading()).toBe(false);
  });
});
