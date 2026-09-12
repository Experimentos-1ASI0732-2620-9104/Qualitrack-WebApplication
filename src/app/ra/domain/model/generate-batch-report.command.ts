/**
 * Command to trigger the generation of a production batch report.
 *
 * @remarks
 * In Domain-Driven Design, this command represents the user's intent to generate
 * an operational report for a specific production batch. It carries the selected
 * batch, output format, included sections, and requester identity.
 */
export interface GenerateBatchReportCommand {
  /**
   * The unique numeric identifier of the production batch.
   */
  batchId: number;

  /**
   * Indicates whether sensor and process telemetry should be included.
   */
  includeTelemetry: boolean;

  /**
   * Indicates whether deviation alerts should be included.
   */
  includeDeviations: boolean;

  /**
   * The requested output format for the generated document.
   */
  format: 'PDF' | 'CSV';

  /**
   * The numeric identifier of the user requesting the report.
   */
  requestedBy: number;
}
