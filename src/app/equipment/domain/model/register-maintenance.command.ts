/**
 * Represents a command used to register a maintenance activity for an equipment.
 *
 * @remarks
 * This command contains the required data to record a maintenance event
 * associated with a specific equipment. It is typically used in the application
 * layer to execute a use case related to maintenance registration.
 *
 * The command does not represent a domain entity by itself. Instead, it carries
 * the input data needed to create a maintenance record with technical,
 * operational, and descriptive information.
 *
 * @example
 * ```typescript
 * const command: RegisterMaintenanceCommand = {
 * equipmentId: 101,
 * maintenanceDate: '2026-05-12',
 * technicianName: 'John Doe',
 * description: 'Preventive maintenance and calibration performed.',
 * type: 'PREVENTIVE'
 * };
 * ```
 */
export interface RegisterMaintenanceCommand {
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
