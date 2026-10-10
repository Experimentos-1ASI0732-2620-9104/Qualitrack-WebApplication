import { EquipmentStatus } from './equipment-status';

/**
 * Command to change the operational status of an equipment located in an environment (US48).
 *
 * @remarks
 * This command only carries the input data of the use case; it is not a domain entity.
 *
 * @example
 * ```typescript
 * const command: ChangeEquipmentStatusCommand = {
 *   status: 'MAINTENANCE',
 *   reason: 'Scheduled preventive maintenance'
 * };
 * ```
 */
export interface ChangeEquipmentStatusCommand {
  /**
   * The new operational status to assign to the equipment.
   */
  status: EquipmentStatus;

  /**
   * The reason for the status change, or `null` when no reason is provided.
   */
  reason: string | null;
}
