import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents an equipment resource received from or sent to the API.
 *
 * @remarks
 * This interface defines the structure of equipment data at the infrastructure
 * level. It is used to transfer equipment information between the frontend
 * application and the backend service.
 *
 * Unlike the domain entity, this resource represents the shape of the data
 * as exposed by the API response or request mapping layer.
 *
 * @example
 * ```typescript
 * const resource: EquipmentResource = {
 * id: 1,
 * labId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001',
 * status: 'OPERATIONAL',
 * createdAt: '2026-05-12T10:00:00Z'
 * };
 * ```
 */
export interface EquipmentResource extends BaseResource {
  /**
   * The unique numeric identifier of the equipment resource.
   */
  id: number;

  /**
   * The numeric identifier of the laboratory associated with the equipment.
   *
   * @remarks
   * This value links the equipment to a specific laboratory registered
   * in the system.
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
   * The serial number supports traceability, inventory control,
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
  status: string;

  sensorExternalId?: string;

  /**
   * The creation date of the equipment resource.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt?: string;
}

/**
 * Represents an API response containing multiple equipment resources.
 *
 * @remarks
 * This interface defines the structure of the response returned by the API
 * when retrieving equipment records. It contains a collection of
 * EquipmentResource objects that can later be transformed into domain entities
 * using an assembler.
 *
 * @example
 * ```typescript
 * const response: EquipmentsResponse = {
 * equipments: [
 * {
 * id: 1,
 * labId: 101,
 * name: 'Centrifuge',
 * type: 'Laboratory Equipment',
 * model: 'CF-3000',
 * serialNumber: 'SN-2026-001',
 * status: 'OPERATIONAL',
 * createdAt: '2026-05-12T10:00:00Z'
 * }
 * ]
 * };
 * ```
 */
export interface EquipmentsResponse extends BaseResponse {
  /**
   * The collection of equipment resources returned by the API.
   *
   * @remarks
   * Each item represents an equipment record with its laboratory assignment,
   * technical information, operational status, and creation date.
   */
  equipments: EquipmentResource[];
}
