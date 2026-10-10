
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';

/**
 * Request resource for receiving a new raw material batch
 * through the backend API.
 *
 * @remarks
 * In Domain-Driven Design, ReceiveRawMaterialBatchRequest is an
 * infrastructure-level request contract that defines the data
 * required to register the receipt of a raw material batch.
 *
 * The request contains supplier information, batch identification,
 * measurement unit, received quantity, receipt date, and
 * expiration date.
 *
 * This interface serves as a data transfer structure between
 * the frontend and backend, without implementing business logic
 * or validation rules.
 *
 * It separates the API request representation from the
 * ReceiveRawMaterialBatchCommand defined in the domain layer.
 */
export interface ReceiveRawMaterialBatchRequest {
  /**
   * The name or identification of the supplier
   * providing the raw material batch.
   */
  supplier: string;

  /**
   * The identification number assigned to the received batch.
   *
   * @remarks
   * This value supports batch identification and traceability
   * throughout inventory operations.
   */
  batchNumber: string;

  /**
   * The measurement unit used to quantify the received material.
   *
   * @remarks
   * The unit must correspond to one of the supported
   * InventoryUnit values: kg, g, L, mL, or units.
   */
  unit: InventoryUnit;

  /**
   * The quantity of raw material received in the batch.
   *
   * @remarks
   * The quantity is expressed using the measurement
   * unit specified in the unit property.
   */
  amount: number;

  /**
   * The date when the raw material batch was received.
   *
   * @remarks
   * The date is represented as a string.
   * Its exact format depends on the API contract.
   */
  receivedOn: string;

  /**
   * The expiration date assigned to the received batch.
   *
   * @remarks
   * This value provides the expiration information
   * required when registering the raw material batch.
   *
   * The date is represented as a string according
   * to the API contract.
   */
  expiresOn: string;
}

/**
 * Request resource for assigning a container monitor
 * to a raw material batch through the backend API.
 *
 * @remarks
 * In Domain-Driven Design, AssignRawMaterialBatchContainerRequest
 * is an infrastructure-level request contract that defines
 * the information required to associate a raw material batch
 * with a container monitor.
 *
 * The request contains the identifier of the monitor
 * associated with the container where the batch is stored (TS29).
 *
 * This interface represents the data transferred to the backend
 * and does not implement the business logic responsible for
 * validating or establishing the assignment.
 */
export interface AssignRawMaterialBatchContainerRequest {
  /**
   * The unique identifier of the container monitor
   * to be assigned to the raw material batch.
   *
   * @remarks
   * This identifier references the monitor associated
   * with the container where the batch is stored (TS29).
   *
   * The backend is responsible for processing
   * the assignment request.
   */
  containerMonitorId: number;
}

/**
 * Request resource for reviewing a raw material batch
 * through the backend API.
 *
 * @remarks
 * In Domain-Driven Design, ReviewRawMaterialBatchRequest
 * is an infrastructure-level request contract that defines
 * the information required to request a batch review.
 *
 * The request contains the status assigned to the batch
 * as a result of the review and the reason associated
 * with that decision.
 *
 * This interface serves as a data transfer structure
 * between the frontend and backend, without implementing
 * business logic or validating status transitions.
 *
 * It separates the API request representation from the
 * ReviewRawMaterialBatchCommand defined in the domain layer.
 */
export interface ReviewRawMaterialBatchRequest {
  /**
   * The status assigned to the raw material batch
   * as a result of the review.
   *
   * @remarks
   * The value must correspond to one of the supported
   * RawMaterialBatchStatus values:
   * QUARANTINED, RELEASED, OBSERVED, or REJECTED.
   *
   * The validity of status transitions must be
   * enforced by the corresponding business logic.
   */
  status: RawMaterialBatchStatus;

  /**
   * The reason or justification associated
   * with the raw material batch review.
   *
   * @remarks
   * This value provides contextual information
   * explaining the decision made during the review.
   */
  reason: string;
}

