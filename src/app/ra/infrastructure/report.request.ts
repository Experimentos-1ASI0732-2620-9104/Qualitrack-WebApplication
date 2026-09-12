export interface GenerateBatchReportRequest {
  batchId: number;
  includeTelemetry: boolean;
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}

export interface GenerateBatchReportBody {
  includeTelemetry: boolean;
  includeDeviations: boolean;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}

export interface GenerateComplianceReportRequest {
  laboratoryId: number;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}

export interface GenerateComplianceReportBody {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}

export interface ExportEquipmentLogRequest {
  equipmentId: number;
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}

export interface ExportEquipmentLogBody {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV';
  requestedBy: number;
}
