/**
 * Command to trigger the export of historical equipment logs.
 *
 * @remarks
 * In Domain-Driven Design, this command represents the user's intent to export
 * audit or operational records for a specific equipment within a date range.
 */
export interface ExportEquipmentLogCommand {
  /**
   * The unique numeric identifier of the equipment.
   */
  equipmentId: number;

  /**
   * The start date and time of the exported period.
   */
  startDate: string;

  /**
   * The end date and time of the exported period.
   */
  endDate: string;

  /**
   * The requested output format for the exported file.
   */
  format: 'PDF' | 'CSV';

  /**
   * The numeric identifier of the user requesting the export.
   */
  requestedBy: number;
}
