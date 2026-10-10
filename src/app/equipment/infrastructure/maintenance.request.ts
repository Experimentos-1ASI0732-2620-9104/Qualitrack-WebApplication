/**
 * Body of `POST .../environments/{environmentId}/equipments/{equipmentId}/maintenance-records` (TS35).
 *
 * @example
 * ```typescript
 * const request: RegisterMaintenanceRequest = {
 *   maintenanceDate: '2026-05-12',
 *   technicianStaffId: 7,
 *   description: 'Preventive maintenance and calibration performed.',
 *   type: 'PREVENTIVE'
 * };
 * ```
 */
export interface RegisterMaintenanceRequest {
  /**
   * The date of the intervention, in `yyyy-MM-dd` format.
   *
   * @remarks
   * It cannot be a date in the future.
   */
  maintenanceDate: string;

  /** The identifier of the staff member who performed the maintenance. */
  technicianStaffId: number;

  /** A descriptive summary of the maintenance activity. */
  description: string;

  /** The type of maintenance performed, such as PREVENTIVE or CORRECTIVE. */
  type: string;
}
