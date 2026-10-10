import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { InventoryUnit } from './raw-material.entity';

/**
 * Defines the possible statuses of a raw material batch.
 *
 * @remarks
 * Each status represents the condition of a batch
 * within the raw material inventory management process.
 *
 * - QUARANTINED: The batch is held pending evaluation or release.
 * - RELEASED: The batch has been approved for use.
 * - OBSERVED: The batch has observations requiring attention.
 * - REJECTED: The batch has been rejected for use.
 */
export type RawMaterialBatchStatus = 'QUARANTINED' | 'RELEASED' | 'OBSERVED' | 'REJECTED';

/**
 * Defines the possible expiration classifications
 * of a raw material batch.
 *
 * @remarks
 * The expiration status is calculated by the server
 * using the configured near-expiry period (US42).
 *
 * - VALID: The batch is not expired or near expiration.
 * - NEAR_EXPIRY: The batch is approaching its expiration date.
 * - EXPIRED: The batch has reached its expiration condition.
 */
export type ExpirationStatus = 'VALID' | 'NEAR_EXPIRY' | 'EXPIRED';

/**
 * Represents a raw material batch within the inventory domain.
 *
 * @remarks
 * In Domain-Driven Design, RawMaterialBatch is an entity
 * within the inventory bounded context that represents
 * a specific batch of raw material registered by a laboratory.
 *
 * Each batch maintains information about its associated
 * raw material, supplier, batch number, measurement unit,
 * initial quantity, available quantity, receipt date,
 * expiration date, and current status.
 *
 * This entity represents domain state independently of HTTP
 * resources. Inventory quantities and expiration classifications
 * are supplied by the server rather than calculated locally.
 *
 * @example
 * ```TypeScript
 * const batch = new RawMaterialBatch({
 *   id: 1,
 *   laboratoryId: 10,
 *   rawMaterialId: 5,
 *   supplier: 'Food Supplies S.A.',
 *   batchNumber: 'LOT-2026-001',
 *   unit: 'kg',
 *   initialAmount: 100,
 *   availableAmount: 80,
 *   receivedOn: '2026-09-01',
 *   expiresOn: '2027-03-01',
 *   status: 'RELEASED',
 *   usable: true,
 *   availability: 'AVAILABLE',
 *   expirationStatus: 'VALID',
 *   containerMonitorId: null
 * });
 *
 * console.log(batch.batchNumber); // 'LOT-2026-001'
 * console.log(batch.availableAmount); // 80
 * ```
 */
export class RawMaterialBatch implements BaseEntity {
  /**
   * The unique identifier of the raw material batch.
   */
  readonly id: number;

  /**
   * The unique identifier of the laboratory
   * associated with the raw material batch.
   */
  readonly laboratoryId: number;

  /**
   * The unique identifier of the raw material
   * to which this batch belongs.
   */
  readonly rawMaterialId: number;

  /**
   * The name or identification of the supplier
   * associated with the raw material batch.
   */
  readonly supplier: string;

  /**
   * The identification number assigned to the batch.
   *
   * @remarks
   * This value supports batch identification and
   * traceability throughout inventory operations.
   */
  readonly batchNumber: string;

  /**
   * The measurement unit used to quantify the batch.
   *
   * @remarks
   * The unit must correspond to one of the supported
   * InventoryUnit values.
   */
  readonly unit: InventoryUnit;

  /**
   * The initial quantity of raw material recorded
   * when the batch was registered.
   */
  readonly initialAmount: number;

  /**
   * The remaining available quantity of raw material
   * associated with the batch.
   *
   * @remarks
   * This value is supplied by the server and represents
   * the recorded available quantity.
   */
  readonly availableAmount: number;

  /**
   * The date when the raw material batch was received.
   *
   * @remarks
   * The date is represented as a string.
   * Its exact format depends on the server response.
   *
   * @example
   * '2026-09-01'
   */
  readonly receivedOn: string;

  /**
   * The expiration date assigned to the raw material batch.
   *
   * @remarks
   * This date is used by the server to determine
   * the expiration classification of the batch.
   *
   * @example
   * '2027-03-01'
   */
  readonly expiresOn: string;

  /**
   * The current status of the raw material batch.
   *
   * @remarks
   * The status must correspond to one of the supported
   * RawMaterialBatchStatus values.
   */
  readonly status: RawMaterialBatchStatus;

  /**
   * Indicates whether the raw material batch
   * is considered usable.
   *
   * @remarks
   * This property is optional and may be undefined
   * when no usability information is provided.
   */
  readonly usable?: boolean;

  /**
   * The availability classification of the raw material batch.
   *
   * @remarks
   * This property is optional and may be undefined
   * when no availability information is provided.
   *
   * The supported values depend on the server response.
   */
  readonly availability?: string;

  /**
   * The expiration classification of the raw material batch.
   *
   * @remarks
   * The classification is calculated by the server
   * using the configured near-expiry period (US42).
   *
   * This property is optional and may be undefined
   * when no expiration classification is provided.
   */
  readonly expirationStatus?: ExpirationStatus;

  /**
   * The identifier of the container monitor associated
   * with the container where the batch is stored.
   *
   * @remarks
   * A null value indicates that the batch does not
   * have an associated container monitor (US43).
   *
   * When the constructor receives no value,
   * this property is initialized to null.
   *
   * @defaultValue null
   */
  readonly containerMonitorId: number | null;

  /**
   * Creates a new RawMaterialBatch entity.
   *
   * @param params - Initialization properties for the batch.
   * @param params.id - Unique identifier of the batch.
   * @param params.laboratoryId - Identifier of the associated laboratory.
   * @param params.rawMaterialId - Identifier of the associated raw material.
   * @param params.supplier - Supplier associated with the batch.
   * @param params.batchNumber - Identification number of the batch.
   * @param params.unit - Measurement unit of the batch.
   * @param params.initialAmount - Initial registered batch quantity.
   * @param params.availableAmount - Available quantity supplied by the server.
   * @param params.receivedOn - Date when the batch was received.
   * @param params.expiresOn - Expiration date of the batch.
   * @param params.status - Current status of the batch.
   * @param params.usable - Optional indicator of batch usability.
   * @param params.availability - Optional availability classification.
   * @param params.expirationStatus - Optional server-calculated expiration classification.
   * @param params.containerMonitorId - Optional container monitor identifier, or null.
   *
   * @remarks
   * The constructor initializes the raw material batch
   * using the provided properties.
   *
   * The usable, availability, expirationStatus, and
   * containerMonitorId parameters are optional.
   *
   * If containerMonitorId is omitted or undefined,
   * it is initialized to null.
   *
   * Inventory quantities and expiration classifications
   * are provided by the server. The constructor does not
   * calculate inventory balances or expiration conditions.
   */
  constructor(params: {
    id: number;
    laboratoryId: number;
    rawMaterialId: number;
    supplier: string;
    batchNumber: string;
    unit: InventoryUnit;
    initialAmount: number;
    availableAmount: number;
    receivedOn: string;
    expiresOn: string;
    status: RawMaterialBatchStatus;
    usable?: boolean;
    availability?: string;
    expirationStatus?: ExpirationStatus;
    containerMonitorId?: number | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.rawMaterialId = params.rawMaterialId;
    this.supplier = params.supplier;
    this.batchNumber = params.batchNumber;
    this.unit = params.unit;
    this.initialAmount = params.initialAmount;
    this.availableAmount = params.availableAmount;
    this.receivedOn = params.receivedOn;
    this.expiresOn = params.expiresOn;
    this.status = params.status;
    this.usable = params.usable;
    this.availability = params.availability;
    this.expirationStatus = params.expirationStatus;
    this.containerMonitorId = params.containerMonitorId ?? null;
  }
}
