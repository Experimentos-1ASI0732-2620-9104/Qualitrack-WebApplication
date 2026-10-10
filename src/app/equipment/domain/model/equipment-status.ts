/**
 * Operational status of an equipment (US48).
 *
 * @remarks
 * - `OPERATIONAL`: the equipment is in normal use.
 * - `MAINTENANCE`: the equipment is undergoing maintenance.
 * - `OUT_OF_SERVICE`: the equipment cannot be used.
 * - `INACTIVE`: the equipment is deactivated.
 */
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';

/**
 * All the valid equipment statuses.
 *
 * @remarks
 * Useful for validations and for building selection lists in the UI.
 */
export const EQUIPMENT_STATUSES: readonly EquipmentStatus[] = ['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE'];

/**
 * Statuses that take the equipment out of normal use and need attention.
 */
export const ATTENTION_STATUSES: readonly EquipmentStatus[] = ['MAINTENANCE', 'OUT_OF_SERVICE'];
