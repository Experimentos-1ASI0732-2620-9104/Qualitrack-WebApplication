/**
 * Represents a request used to register a maintenance activity for an equipment.
 *
 * @remarks
 * This request contains the required data to create a maintenance record
 * associated with a specific equipment. It is commonly used in the presentation
 * or application layer when a user or client submits maintenance information.
 *
 * Unlike a domain entity, this request only carries input data needed to
 * register the maintenance activity, including the equipment reference,
 * maintenance date, technician name, description, and maintenance type.
 *
 * @example
 * ```typescript
 * const request: RegisterMaintenanceRequest = {
 * equipmentId: 101,
 * maintenanceDate: '2026-05-12',
 * technicianName: 'John Doe',
 * description: 'Preventive maintenance and calibration performed.',
 * type: 'PREVENTIVE'
 * };
 * ```
 */
export interface RegisterMaintenanceRequest {
  /**
   * The numeric identifier of the equipment associated with the maintenance activity.
   *
   * @remarks
   * This value links the maintenance registration request to a specific
   * equipment registered in the system.
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
   * This field identifies the person who performed or registered the
   * maintenance work.
   */
  technicianName: string;

  /**
   * A descriptive summary of the maintenance activity.
   *
   * @remarks
   * This description may include performed tasks, detected issues,
   * replaced components, calibration details, or recommendations.
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
}
