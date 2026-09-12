/**
 * Represents the intention to register a new production batch within the system.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this command belongs to the
 * application layer. It encapsulates all input data required to create a new
 * production batch, keeping the presentation layer decoupled from the domain
 * entity constructor and backend request details.
 *
 * @example
 * ```typescript
 * const command: CreateBatchCommand = {
 *   labId: 1,
 *   productId: 890,
 *   batchNumber: 'LOT-2026-001',
 *   quantity: 5000,
 *   unit: 'units',
 *   startDate: '2026-05-12T08:00:00Z',
 *   notes: 'Urgent production requested by central distribution.'
 * };
 * ```
 */
export interface CreateBatchCommand {
  /**
   * The numeric identifier of the laboratory where the batch will be produced.
   */
  labId: number;

  /**
   * The numeric identifier of the product that is going to be manufactured.
   */
  productId: number;

  /**
   * The specific alphanumeric traceability code assigned to this batch run.
   */
  batchNumber: string;

  /**
   * The intended total volume or amount to be produced in this batch.
   */
  quantity: number;

  /**
   * The unit of measurement for the batch quantity.
   */
  unit: string;

  /**
   * The ISO date string representing when the batch processing is scheduled to begin.
   */
  startDate: string;

  /**
   * Optional domain-specific remarks or instructions prior to batch creation.
   */
  notes?: string;
}
