/**
 * Body of POST .../products/{productId}/batches.
 *
 * @remarks
 * Infrastructure-level contract sent to the API to register a manufacturing batch. The laboratory,
 * environment and product travel in the route, not in the body.
 *
 * @example
 * ```typescript
 * const request: CreateBatchRequest = {
 *   batchNumber: 'L-2026-001',
 *   quantity: 1000,
 *   unit: 'units',
 *   startDate: '2026-10-05'
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface CreateBatchRequest {
  /**
   * Traceability code, unique in the laboratory.
   */
  batchNumber: string;

  /**
   * Quantity to produce.
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

/**
 * Body of POST .../batches/{batchId}/releases.
 *
 * @remarks
 * Only the QA Manager can release a batch. The API signs the release with a SHA-256 digital signature
 * of the user and the time.
 *
 * @author Qualitrack
 */
export interface ReleaseBatchRequest {
  /**
   * The ISO date string of the moment the batch is released.
   */
  releaseDate: string;

  /**
   * Final quality control observations that justify the release.
   */
  notes: string;
}

/**
 * Body of POST .../batches/{batchId}/rejections.
 *
 * @remarks
 * Only the QA Manager can reject a batch, always with a reason.
 *
 * @author Qualitrack
 */
export interface RejectBatchRequest {
  /**
   * The ISO date string of the moment the batch is rejected.
   */
  rejectionDate: string;

  /**
   * The justification of the rejection.
   */
  reason: string;
}

/**
 * Body of POST .../batches/{batchId}/equipment-usages.
 *
 * @remarks
 * Only operational equipment can be used in a batch.
 *
 * @author Qualitrack
 */
export interface RegisterEquipmentUsageRequest {
  /**
   * The numeric identifier of the equipment used in the batch.
   */
  equipmentId: number;
}

/**
 * Body of PUT .../batches/{batchId}/container-assignment.
 *
 * @remarks
 * The container monitor must be operational and belong to a finished product storage environment.
 *
 * @author Qualitrack
 */
export interface AssignBatchContainerRequest {
  /**
   * The numeric identifier of the container monitor where the batch is stored.
   */
  containerMonitorId: number;
}

/**
 * Body of POST .../batches/{batchId}/staff-participations.
 *
 * @remarks
 * The QA Manager can assign any operator; an operator can only assign themselves; auditors do not take part.
 *
 * @author Qualitrack
 */
export interface RegisterStaffParticipationRequest {
  /**
   * The numeric identifier of the staff member who takes part in the batch.
   */
  staffId: number;
}
