export interface GenerateBatchReportRequest {
  batchId: number;
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
}

export interface GenerateBatchReportBody {
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
}

export interface GenerateComplianceReportRequest {
  laboratoryId: number;
  environmentId: number | null;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface GenerateComplianceReportBody {
  environmentId: number | null;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface ExportEquipmentLogRequest {
  laboratoryId: number;
  environmentId: number;
  equipmentId: number;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

export interface ExportEquipmentLogBody {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
}

/** Inventory report of the laboratory or of one environment (TS85). */
export interface GenerateInventoryReportRequest {
  laboratoryId: number;
  environmentId: number | null;
  format: 'PDF' | 'CSV';
}

export interface GenerateInventoryReportBody {
  environmentId: number | null;
  format: 'PDF' | 'CSV';
}
