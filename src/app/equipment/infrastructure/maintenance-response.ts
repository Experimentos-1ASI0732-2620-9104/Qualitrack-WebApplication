import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Represents a maintenance resource received from or sent to the API.
 *
 * @remarks
 * This interface defines the structure of maintenance data at the infrastructure
 * level. It is used to transfer maintenance information between the frontend
 * application and the backend service.
 *
 * Unlike the domain entity, this resource represents the shape of the data
 * as exposed by the API response or request mapping layer.
 *
 * @example
 * ```typescript
 * const resource: MaintenanceResource = {
 * id: 1,
 * equipmentId: 101,
 * maintenanceDate: '2026-05-12',
 * technicianName: 'John Doe',
 * description: 'Preventive maintenance and calibration performed.',
 * type: 'PREVENTIVE',
 * createdAt: '2026-05-12T10:00:00Z'
 * };
 * ```
 */
export interface MaintenanceResource extends BaseResource {
  /**
   * The unique numeric identifier of the maintenance resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment associated with the maintenance record.
   *
   * @remarks
   * This value links the maintenance resource to a specific equipment registered
   * in the system.
   */
  equipmentId: number;

  /**
   * The date when the maintenance activity was performed.
   *
   * @remarks
   * This value is stored as a string and may follow a standard date format,
   * such as ISO 8601.
   */
  maintenanceDate: string;

  /**
   * The name of the technician responsible for the maintenance activity.
   *
   * @remarks
   * This field identifies the person who performed, supervised, or registered
   * the maintenance work.
   */
  technicianName: string;

  /**
   * A descriptive summary of the maintenance activity.
   *
   * @remarks
   * This description may include performed tasks, detected issues, replaced
   * components, calibration details, inspections, or technical recommendations.
   */
  description: string;

  /**
   * The type of maintenance performed.
   *
   * @remarks
   * Examples may include PREVENTIVE, CORRECTIVE, CALIBRATION, INSPECTION,
   * or other maintenance categories defined by the system.
   */
  type: string;

  /**
   * The creation date of the maintenance resource.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt?: string;
}

/**
 * Represents an API response containing multiple maintenance resources.
 *
 * @remarks
 * This interface defines the structure of the response returned by the API
 * when retrieving maintenance records. It contains a collection of
 * MaintenanceResource objects that can later be transformed into domain
 * entities using an assembler.
 *
 * @example
 * ```typescript
 * const response: MaintenancesResponse = {
 * maintenances: [
 * {
 * id: 1,
 * equipmentId: 101,
 * maintenanceDate: '2026-05-12',
 * technicianName: 'John Doe',
 * description: 'Preventive maintenance and calibration performed.',
 * type: 'PREVENTIVE',
 * createdAt: '2026-05-12T10:00:00Z'
 * }
 * ]
 * };
 * ```
 */
export interface MaintenancesResponse extends BaseResponse {
  /**
   * The collection of maintenance resources returned by the API.
   *
   * @remarks
   * Each item represents a maintenance record associated with a specific
   * equipment, including date, technician, description, type, and creation date.
   */
  maintenances: MaintenanceResource[];
}
