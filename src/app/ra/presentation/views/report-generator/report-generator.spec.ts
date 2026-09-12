import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ReportGeneratorComponent } from './report-generator';
import { RaStore } from '../../../application/ra.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchStore } from '../../../../batch/application/batch.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';

class ReportGeneratorHarness extends ReportGeneratorComponent {
  selectBatch(id: number) { this.batchForm.batchId = id; }
  selectEquipment(id: number) {
    this.equipmentForm.equipmentId = id;
    this.equipmentForm.startDate = new Date('2026-09-01');
    this.equipmentForm.endDate = new Date('2026-09-05');
  }
  generateBatch() { this.onGenerateBatchReport(); }
  exportEquipment() { this.onExportEquipmentLog(); }
  retryBatches() { this.reloadBatches(); }
  get batchReady() { return this.hasSelectedBatch; }
}

describe('ReportGenerator resource selection', () => {
  const batches = {
    batches: signal([{ id: 47, labId: 42 }, { id: 51, labId: 99 }]),
    isLoading: signal(false), error: signal<string | null>(null), loadBatches: vi.fn(),
  };
  const equipment = {
    equipmentList: signal([{ id: 63, labId: 42 }, { id: 64, labId: 99 }]),
    isLoading: signal(false), error: signal<string | null>(null), loadEquipment: vi.fn(),
  };
  const reports = {
    isLoading: signal(false), clearMessages: vi.fn(), generateBatchReport: vi.fn(), exportEquipmentLog: vi.fn(),
  };
  let component: ReportGeneratorHarness;

  beforeEach(() => {
    vi.clearAllMocks();
    batches.isLoading.set(false);
    batches.error.set(null);
    equipment.isLoading.set(false);
    equipment.error.set(null);
    reports.isLoading.set(false);
    TestBed.configureTestingModule({ providers: [
      { provide: RaStore, useValue: reports }, { provide: BatchStore, useValue: batches },
      { provide: EquipmentStore, useValue: equipment },
      { provide: IamStore, useValue: { requireUserId: () => 27, requireLaboratoryId: () => 42 } },
    ] });
    component = TestBed.runInInjectionContext(() => new ReportGeneratorHarness());
  });

  it('loads options for the verified laboratory without assuming ID 1', () => {
    component.ngOnInit();
    expect(batches.loadBatches).toHaveBeenCalledWith(42);
    expect(equipment.loadEquipment).toHaveBeenCalledWith(42);
    expect(component.batchReady).toBe(false);
    component.selectBatch(1);
    component.generateBatch();
    expect(reports.generateBatchReport).not.toHaveBeenCalled();
    component.selectBatch(47);
    component.generateBatch();
    expect(reports.generateBatchReport).toHaveBeenCalledWith({
      batchId: 47, includeTelemetry: false, includeDeviations: true, format: 'PDF', requestedBy: 27,
    });
  });

  it('rejects foreign records and blocks requests while loading, failed or generating', () => {
    component.selectBatch(51);
    expect(component.batchReady).toBe(false);
    component.selectBatch(47);
    batches.isLoading.set(true);
    component.generateBatch();
    batches.isLoading.set(false);
    batches.error.set('Unavailable');
    component.generateBatch();
    batches.error.set(null);
    reports.isLoading.set(true);
    component.generateBatch();
    expect(reports.generateBatchReport).not.toHaveBeenCalled();
  });

  it('clears a stale selection before retrying the list', () => {
    component.selectBatch(47);
    expect(component.batchReady).toBe(true);
    component.retryBatches();
    expect(component.batchReady).toBe(false);
    expect(batches.loadBatches).toHaveBeenCalledWith(42);
  });

  it('exports only a selected equipment belonging to the current laboratory', () => {
    component.selectEquipment(1);
    component.exportEquipment();
    component.selectEquipment(64);
    component.exportEquipment();
    expect(reports.exportEquipmentLog).not.toHaveBeenCalled();
    component.selectEquipment(63);
    component.exportEquipment();
    expect(reports.exportEquipmentLog).toHaveBeenCalledWith(expect.objectContaining({ equipmentId: 63, requestedBy: 27, format: 'PDF' }));
  });
});
