/**
 * Command to trigger the generation of a regulatory compliance report for a laboratory.
 *
 * @remarks
 * In Domain-Driven Design, this command represents the user's intent to generate
 * a compliance audit document for a laboratory within a specific time window.
 */
export interface GenerateComplianceReportCommand {
  /**
   * The unique numeric identifier of the laboratory.
   */
  laboratoryId: number;

  /**
   * The start date and time of the reporting period.
   */
  startDate: string;

  /**
   * The end date and time of the reporting period.
   */
  endDate: string;

  /**
   * The requested output format for the generated document.
   */
  format: 'PDF' | 'CSV';

  /**
   * The numeric identifier of the user requesting the report.
   */
  requestedBy: number;
}
