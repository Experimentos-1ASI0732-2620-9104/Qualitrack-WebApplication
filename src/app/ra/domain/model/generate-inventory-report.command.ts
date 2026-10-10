/**
 * Command to generate the inventory report of the laboratory or of one of its environments (US97).
 */
export interface GenerateInventoryReportCommand {
  laboratoryId: number;
  /** Optional environment; null covers every environment of the laboratory. */
  environmentId: number | null;
  format: 'PDF' | 'CSV';
}
