/**
 * Command to generate the environmental report of a period (US95): indicators, alerts and actions per environment.
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
   * Optional environment; null covers every environment of the laboratory.
   */
  environmentId: number | null;

  /**
   * First calendar day of the period (yyyy-MM-dd).
   */
  startDate: string;

  /**
   * Last calendar day of the period (yyyy-MM-dd).
   */
  endDate: string;

  /**
   * The requested output format for the generated document.
   */
  format: 'PDF' | 'CSV';
}
