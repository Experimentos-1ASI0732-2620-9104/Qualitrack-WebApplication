import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents an equipment entity within the laboratory or equipment management domain.
 *
 * @remarks
 * This entity models a physical equipment registered in the system. Each equipment
 * belongs to a specific laboratory and includes identification, classification,
 * technical, and operational status information.
 *
 * In a domain-driven design context, Equipment is an entity because it has a unique
 * identity that persists throughout its lifecycle, regardless of changes in its
 * attributes such as status, model, or name.
 *
 * @example
 * ```typescript
 * const equipment = new Equipment({
 * id: 1,
 * labId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001',
 * status: 'OPERATIONAL',
 * createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(equipment.name); // 'Centrifuge'
 * ```
 */
export class Equipment implements BaseEntity {
  /**
   * The unique numeric identifier of the equipment.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory where the equipment is located or assigned.
   *
   * @remarks
   * This value links the equipment to a specific laboratory within the system.
   */
  labId: number;

  /**
   * The display name of the equipment.
   *
   * @remarks
   * This name is used to identify the equipment in the system interface
   * or within operational records.
   */
  name: string;

  /**
   * The type or category of the equipment.
   *
   * @remarks
   * Examples may include biomedical equipment, laboratory equipment,
   * industrial equipment, measurement equipment, or diagnostic equipment.
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
   * The serial number is commonly used for traceability, inventory control,
   * maintenance records, and manufacturer identification.
   */
  serialNumber: string;

  /**
   * The current operational status of the equipment.
   *
   * @remarks
   * This value indicates the condition or availability of the equipment.
   * Examples include OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE, or INACTIVE.
   */
  status: string; // OPERATIONAL, MAINTENANCE, etc.

  /**
   * The creation date of the equipment record.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */

  sensorExternalId?: string;

  createdAt: string;

  /**
   * Creates a new Equipment entity.
   *
   * @param params - Initialization properties for the equipment.
   * @param params.id - The unique numeric identifier of the equipment.
   * @param params.labId - The numeric identifier of the laboratory associated with the equipment.
   * @param params.name - The display name of the equipment.
   * @param params.type - The type or category of the equipment.
   * @param params.model - The model of the equipment.
   * @param params.serialNumber - The serial number of the equipment.
   * @param params.status - The current operational status of the equipment.
   * @param params.createdAt - The creation date of the equipment record.
   *
   * @remarks
   * The constructor initializes the equipment entity with all required values.
   * Each equipment must be associated with a laboratory and must contain
   * enough technical information to support identification and traceability.
   */
  constructor(params: {
    id: number;
    labId: number;
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    status: string;
    createdAt: string;
    sensorExternalId?: string;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.name = params.name;
    this.type = params.type;
    this.model = params.model;
    this.serialNumber = params.serialNumber;
    this.status = params.status;
    this.createdAt = params.createdAt;
    this.sensorExternalId = params.sensorExternalId;
  }
}
