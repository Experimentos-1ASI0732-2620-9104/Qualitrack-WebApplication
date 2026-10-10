
import { InventoryUnit } from './raw-material.entity';

/**
 * Represents a command to receive a new raw material batch
 * within the inventory domain.
 *
 * @remarks
 * In Domain-Driven Design, ReceiveRawMaterialBatchCommand
 * encapsulates the information required to register the
 * receipt of a raw material batch in the inventory bounded context.
 *
 * The command contains supplier information, batch identification,
 * measurement unit, received quantity, receipt date, and
 * expiration date.
 *
 * This interface defines the data required to request the
 * operation but does not implement the business logic
 * responsible for processing the batch receipt.
 *
 * @example
 * ```TypeScript
 * const command: ReceiveRawMaterialBatchCommand = {
 *   supplier: 'Food Supplies S.A.',
 *   batchNumber: 'LOT-2026-001',
 *   unit: 'kg',
 *   amount: 100,
 *   receivedOn: '2026-10-07',
 *   expiresOn: '2027-04-07'
 * };
 *
 * console.log(command.batchNumber); // 'LOT-2026-001'
 * console.log(command.amount); // 100
 * ```
 */
export interface ReceiveRawMaterialBatchCommand {
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
   * InventoryUnit values.
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
   * Its exact format depends on the application contract.
   *
   * @example
   * '2026-10-07'
   */
  receivedOn: string;

  /**
   * The expiration date assigned to the received batch.
   *
   * @remarks
   * This date provides the expiration information
   * required when registering the raw material batch.
   *
   * @example
   * '2027-04-07'
   */
  expiresOn: string;
}

