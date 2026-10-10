import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { ExpirationStatus, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';

/**
 * Resource representation of a raw material batch for API communication.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterialBatchResource is an
 * infrastructure-level resource contract that represents
 * a raw material batch as returned by the backend API.
 *
 * This resource contains batch identification, laboratory and
 * raw material references, supplier information, measurement unit,
 * inventory quantities, receipt date, expiration date, and batch status.
 *
 * It also supports optional usability, availability, expiration
 * classification, and container monitor information.
 *
 * Inventory quantities and expiration classifications are supplied
 * by the server. This resource contains no domain logic and can be
 * converted into a RawMaterialBatch domain entity through an assembler.
 */
export interface RawMaterialBatchResource extends BaseResource {
  /**
   * The unique identifier of the raw material batch.
   */
  id: number;

  /**
   * The unique identifier of the laboratory
   * associated with the raw material batch.
   */
  laboratoryId: number;

  /**
   * The identifier of the raw material
   * to which this batch belongs.
   */
  rawMaterialId: number;

  /**
   * The name or identification of the supplier
   * associated with the raw material batch.
   */
  supplier: string;

  /**
   * The identification number assigned to the batch.
   *
   * @remarks
   * This value supports batch identification and traceability
   * throughout inventory operations.
   */
  batchNumber: string;

  /**
   * The measurement unit used to quantify the batch.
   *
   * @remarks
   * The value must correspond to one of the supported
   * InventoryUnit values: kg, g, L, mL, or units.
   */
  unit: InventoryUnit;

  /**
   * The initial quantity of raw material
   * recorded when the batch was registered.
   */
  initialAmount: number;

  /**
   * The remaining available quantity of raw material
   * associated with the batch.
   *
   * @remarks
   * This value is supplied by the backend and represents
   * the recorded available quantity.
   */
  availableAmount: number;

  /**
   * The date when the raw material batch was received.
   *
   * @remarks
   * The date is represented as a string according
   * to the API contract.
   */
  receivedOn: string;

  /**
   * The expiration date assigned to the raw material batch.
   *
   * @remarks
   * This date is used by the backend to determine
   * the expiration classification of the batch.
   */
  expiresOn: string;

  /**
   * The current operational status of the raw material batch.
   *
   * @remarks
   * The value must correspond to one of the supported
   * RawMaterialBatchStatus values:
   * QUARANTINED, RELEASED, OBSERVED, or REJECTED.
   */
  status: RawMaterialBatchStatus;

  /**
   * Indicates whether the raw material batch
   * is considered usable.
   *
   * @remarks
   * This property is optional and may be undefined
   * when usability information is not included
   * in the API response.
   */
  usable?: boolean;

  /**
   * The availability classification of the raw material batch.
   *
   * @remarks
   * This property is optional and may be undefined
   * when availability information is not provided.
   *
   * The supported values depend on the backend API contract.
   */
  availability?: string;

  /**
   * The expiration classification of the raw material batch.
   *
   * @remarks
   * This value is calculated by the backend using the
   * configured near-expiry period (US42).
   *
   * Supported values are VALID, NEAR_EXPIRY, and EXPIRED.
   * The property may be undefined when the classification
   * is not included in the API response.
   */
  expirationStatus?: ExpirationStatus;

  /**
   * The identifier of the container monitor associated
   * with the container where the batch is stored.
   *
   * @remarks
   * A null value indicates that the batch has no
   * associated container monitor.
   *
   * This property is optional and may also be undefined
   * when the information is omitted from the API response.
   */
  containerMonitorId?: number | null;
}

/**
 * Resource representation of a raw material batch
 * container assignment for API communication.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterialBatchContainerResource
 * is an infrastructure-level resource contract that represents
 * the container monitor assignment associated with a raw material batch.
 *
 * This resource contains the batch identifier, container monitor
 * reference, container name, storage environment, responsible actor,
 * and assignment timestamp.
 *
 * The resource serves as a data transfer structure and does not
 * implement the business logic responsible for assigning
 * or validating container monitors.
 */
export interface RawMaterialBatchContainerResource {
  /**
   * The unique identifier of the raw material batch
   * associated with the container assignment.
   */
  rawMaterialBatchId: number;

  /**
   * The unique identifier of the container monitor
   * assigned to the raw material batch.
   */
  containerMonitorId: number;

  /**
   * The descriptive name of the container
   * associated with the assigned monitor.
   *
   * @remarks
   * A null value indicates that no container name
   * is provided in the resource.
   */
  containerName: string | null;

  /**
   * The unique identifier of the storage environment
   * associated with the container assignment.
   */
  environmentId: number;

  /**
   * The unique identifier of the actor
   * responsible for the container assignment.
   */
  assignedBy: number;

  /**
   * The date and time when the container monitor
   * was assigned to the raw material batch.
   *
   * @remarks
   * The timestamp is represented as a string.
   * Its exact format depends on the API contract.
   */
  assignedAt: string;
}

/**
 * Resource representation of a raw material batch review
 * for API communication.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterialBatchReviewResource
 * is an infrastructure-level resource contract that represents
 * a review registered for a raw material batch.
 *
 * This resource contains the batch and raw material identifiers,
 * previous and resulting batch statuses, review justification,
 * responsible actor, and review timestamp.
 *
 * The resource supports the representation of review results
 * and status transitions without implementing the business
 * logic responsible for validating or processing them.
 */
export interface RawMaterialBatchReviewResource {
  /**
   * The unique identifier of the raw material batch
   * associated with the review.
   */
  rawMaterialBatchId: number;

  /**
   * The unique identifier of the raw material
   * to which the reviewed batch belongs.
   */
  rawMaterialId: number;

  /**
   * The status of the raw material batch
   * before the review was registered.
   *
   * @remarks
   * This value must correspond to one of the supported
   * RawMaterialBatchStatus values.
   *
   * It provides information about the previous
   * operational condition of the batch.
   */
  previousStatus: RawMaterialBatchStatus;

  /**
   * The status assigned to the raw material batch
   * as a result of the review.
   *
   * @remarks
   * This value represents the resulting batch status
   * after the review operation.
   *
   * The validity of the status transition is determined
   * by the corresponding backend business logic.
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

  /**
   * The unique identifier of the actor
   * responsible for performing the batch review.
   */
  reviewedBy: number;

  /**
   * The date and time when the raw material
   * batch review was registered.
   *
   * @remarks
   * The timestamp is represented as a string.
   * Its exact format depends on the API contract.
   */
  reviewedAt: string;
}

/**
 * Response envelope for raw material batch collection queries.
 *
 * @remarks
 * RawMaterialBatchesResponse defines the structure of API
 * responses that return multiple raw material batch resources.
 *
 * The response contains a collection of RawMaterialBatchResource
 * objects, each representing a raw material batch registered
 * within the inventory system.
 *
 * This interface extends BaseResponse and follows the response
 * envelope pattern to maintain a consistent structure for
 * communication between the backend and frontend.
 *
 * The returned resources can be transformed into RawMaterialBatch
 * domain entities through the corresponding assembler.
 */
export interface RawMaterialBatchesResponse extends BaseResponse {
  /**
   * The collection of raw material batch resources
   * included in the API response.
   *
   * @remarks
   * Contains zero or more RawMaterialBatchResource objects,
   * each representing a raw material batch that can
   * be converted into a RawMaterialBatch domain entity.
   *
   * An empty array indicates that no raw material
   * batch resources were included in the response.
   */
  rawMaterialBatches: RawMaterialBatchResource[];
}
