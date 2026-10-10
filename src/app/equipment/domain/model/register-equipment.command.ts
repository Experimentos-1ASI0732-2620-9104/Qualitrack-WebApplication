/**
 * Command to register an equipment in the current laboratory (US45).
 *
 * @remarks
 * This command only carries the input data of the use case; it is not a domain entity.
 *
 * @example
 * ```typescript
 * const command: RegisterEquipmentCommand = {
 *   name: 'Analytical balance',
 *   type: 'Balance',
 *   model: 'AX-224',
 *   serialNumber: 'SN-12345'
 * };
 * ```
 */
export interface RegisterEquipmentCommand {
  /**
   * The display name of the equipment.
   */
  name: string;

  /**
   * The type or category of the equipment.
   */
  type: string;

  /**
   * The model of the equipment.
   */
  model: string;

  /**
   * The serial number of the equipment.
   */
  serialNumber: string;
}
