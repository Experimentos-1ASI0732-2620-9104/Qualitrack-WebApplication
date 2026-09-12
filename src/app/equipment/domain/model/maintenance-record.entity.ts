import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Represents a maintenance record within the equipment management domain.
 *
 * @remarks
 * This entity stores information about a maintenance activity performed on
 * a specific equipment. It includes the maintenance date, responsible technician,
 * description of the work performed, maintenance type, and creation date.
 *
 * In a domain-driven design context, MaintenanceRecord is an entity because
 * each record has a unique identity and represents a specific maintenance event
 * in the lifecycle of an equipment.
 *
 * @example
 * ```typescript
 * const record = new MaintenanceRecord({
 * id: 1,
 * equipmentId: 101,
 * maintenanceDate: '2026-05-12',
 * technicianName: 'John Doe',
 * description: 'Preventive maintenance and calibration performed.',
 * type: 'PREVENTIVE',
 * createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(record.technicianName); // 'John Doe'
 * ```
 */
export class MaintenanceRecord implements BaseEntity {
  /**
   * The unique numeric identifier of the maintenance record.
   */
  id: number;

  /**
   * The numeric identifier of the equipment associated with this maintenance record.
   *
   * @remarks
   * This value links the maintenance activity to a specific equipment registered
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
   * This field helps identify who performed or registered the maintenance work.
   */
  technicianName: string;

  /**
   * A descriptive summary of the maintenance activity.
   *
   * @remarks
   * This description may include performed tasks, detected issues, replaced
   * components, calibration details, or recommendations.
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
   * The creation date of the maintenance record.
   *
   * @remarks
   * This value is stored as a string, commonly using ISO 8601 date format.
   */
  createdAt: string;

  /**
   * Creates a new MaintenanceRecord entity.
   *
   * @param params - Initialization properties for the maintenance record.
   * @param params.id - The unique numeric identifier of the maintenance record.
   * @param params.equipmentId - The numeric identifier of the equipment associated with the record.
   * @param params.maintenanceDate - The date when the maintenance activity was performed.
   * @param params.technicianName - The name of the technician responsible for the maintenance.
   * @param params.description - The description of the maintenance activity.
   * @param params.type - The type of maintenance performed.
   * @param params.createdAt - The creation date of the maintenance record.
   *
   * @remarks
   * The constructor initializes the maintenance record with all required values.
   * Each record represents a specific maintenance event associated with one
   * equipment.
   */
  constructor(params: {
    id: number;
    equipmentId: number;
    maintenanceDate: string;
    technicianName: string;
    description: string;
    type: string;
    createdAt: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.maintenanceDate = params.maintenanceDate;
    this.technicianName = params.technicianName;
    this.description = params.description;
    this.type = params.type;
    this.createdAt = params.createdAt;
  }
}
