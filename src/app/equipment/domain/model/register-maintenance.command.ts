/**
 * Command to register a maintenance performed on an equipment located in an environment (US49).
 *
 * @remarks
 * This command only carries the input data of the use case; it is not a domain entity.
 *
 * @example
 * ```typescript
 * const command: RegisterMaintenanceCommand = {
 *   maintenanceDate: '2026-05-12',
 *   technicianStaffId: 7,
 *   description: 'Preventive maintenance and calibration performed.',
 *   type: 'PREVENTIVE'
 * };
 * ```
 */
export interface RegisterMaintenanceCommand {
  /**
   * The date of the intervention, in `yyyy-MM-dd` format.
   *
   * @remarks
   * It cannot be a date in the future.
   */
  maintenanceDate: string;

  /**
   * The identifier of the staff member who performed the maintenance.
   *
   * @remarks
   * It is chosen from the staff list; operators can only choose themselves.
   */
  technicianStaffId: number;

  /**
   * A descriptive summary of the maintenance activity.
   */
  description: string;

  /**
   * The type of maintenance performed, such as PREVENTIVE or CORRECTIVE.
   */
  type: string;
}
