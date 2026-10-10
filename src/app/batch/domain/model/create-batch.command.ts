/**
 * Intent to register a manufacturing batch of the product taken from the route.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this Command belongs to the application layer. It
 * encapsulates the data needed to register a batch, acting as a strict boundary contract for the use case.
 * The laboratory, environment and product come from the route, not from the command.
 *
 * @example
 * ```typescript
 * const command: CreateBatchCommand = {
 *   batchNumber: 'L-2026-001',
 *   quantity: 1000,
 *   unit: 'units',
 *   startDate: '2026-10-05',
 *   notes: 'First run of the month.'
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface CreateBatchCommand {
  /**
   * Traceability code, unique in the laboratory (maximum 50 characters).
   */
  batchNumber: string;

  /**
   * Quantity to produce, greater than zero.
   */
  quantity: number;

  /**
   * Production unit.
   */
  unit: string;

  /**
   * Start date (yyyy-MM-dd).
   */
  startDate: string;

  /**
   * Optional manufacturing notes.
   */
  notes?: string;
}
