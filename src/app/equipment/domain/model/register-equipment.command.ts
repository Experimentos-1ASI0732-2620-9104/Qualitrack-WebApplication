/**
 * Represents a command used to register a new equipment in the system.
 *
 * @remarks
 * This command contains the required data to create or register an equipment
 * within a laboratory. It is commonly used in the application layer to execute
 * a use case related to equipment registration.
 *
 * The command does not represent a domain entity by itself. Instead, it carries
 * the input data needed to create an equipment record with its basic technical
 * and identification information.
 *
 * @example
 * ```typescript
 * const command: RegisterEquipmentCommand = {
 * labId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001'
 * };
 * ```
 */
export interface RegisterEquipmentCommand {
  /**
   * The numeric identifier of the laboratory where the equipment will be registered.
   *
   * @remarks
   * This value links the equipment to a specific laboratory within the system.
   */
  laboratoryId: number;

  /**
   * The display name of the equipment.
   *
   * @remarks
   * This name is used to identify the equipment in the system interface,
   * inventory records, or operational workflows.
   */
  name: string;

  /**
   * The type or category of the equipment.
   *
   * @remarks
   * Examples may include biomedical equipment, laboratory equipment,
   * diagnostic equipment, measurement equipment, or industrial equipment.
   */
  type: string;

  /**
   * The model of the equipment.
   *
   * @remarks
   * This value identifies the technical or commercial model assigned
   * by the manufacturer.
   */
  model: string;

  /**
   * The serial number of the equipment.
   *
   * @remarks
   * The serial number is used for traceability, inventory control,
   * maintenance records, and manufacturer identification.
   */
  serialNumber: string;
}
