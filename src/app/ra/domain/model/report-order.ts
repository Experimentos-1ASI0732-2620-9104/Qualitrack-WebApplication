import { GenerateBatchReportCommand } from './generate-batch-report.command';
import { GenerateComplianceReportCommand } from './generate-compliance-report.command';
import { GenerateInventoryReportCommand } from './generate-inventory-report.command';
import { ExportEquipmentLogCommand } from './export-equipment-log.command';

/**
 * A report to generate: its type and the command with its parameters.
 *
 * @remarks
 * The platform stores every report it generates (TS87), so two orders with the same type and parameters describe the
 * same document.
 */
export type ReportOrder =
  | { type: 'batch'; command: GenerateBatchReportCommand }
  | { type: 'compliance'; command: GenerateComplianceReportCommand }
  | { type: 'inventory'; command: GenerateInventoryReportCommand }
  | { type: 'equipment'; command: ExportEquipmentLogCommand };
