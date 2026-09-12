/**
 * Represents a request used to register a new equipment in the system.
 *
 * @remarks
 * This request contains the required data to create an equipment record
 * associated with a specific laboratory. It is commonly used in the
 * presentation or application layer when a user or client submits equipment
 * registration information.
 *
 * Unlike a domain entity, this request only carries input data needed to
 * register the equipment, including its laboratory assignment, name, type,
 * model, and serial number.
 *
 * @example
 * ```typescript
 * const request: RegisterEquipmentRequest = {
 * labId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001'
 * };
 * ```
 */
export interface RegisterEquipmentRequest {
  /**
   * The numeric identifier of the laboratory where the equipment will be registered.
   *
   * @remarks
   * This value links the equipment registration request to a specific
   * laboratory within the system.
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
