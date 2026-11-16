import { BaseEntity } from '../../../shared/domain/model/base-entity';
/**
 * Equipment used in a product batch.
 *
 * @remarks
 * The equipment name is a snapshot: it is the one the equipment had when it was associated with the batch,
 * so later renames do not alter the batch history.
 *
 * @example
 * ```typescript
 * const usage = new EquipmentUsage({
 *   id: 1,
 *   batchId: 101,
 *   equipmentId: 7,
 *   equipmentName: 'Mixer M-01',
 *   registeredByUserId: 4,
 *   registeredAt: '2026-10-05T09:30:00Z'
 * });
 * ```
 *
 * @author Qualitrack
 */
export class EquipmentUsage implements BaseEntity {
  /**
   * The unique numeric identifier of the usage record.
   */
  id: number;

  /**
   * The numeric identifier of the batch that used the equipment.
   */
  batchId: number;

  /**
   * The numeric identifier of the equipment used.
   */
  equipmentId: number;

  /**
   * The name the equipment had when it was associated with the batch.
   */
  equipmentName: string;

  /**
   * The identifier of the user who registered the usage, if known.
   */
  registeredByUserId: number | null;

  /**
   * The ISO date string of the moment the usage was registered.
   */
  registeredAt: string;

  constructor(params: {
    id: number;
    batchId: number;
    equipmentId: number;
    equipmentName: string;
    registeredByUserId: number | null;
    registeredAt: string;
  }) {
    this.id = params.id;
    this.batchId = params.batchId;
    this.equipmentId = params.equipmentId;
    this.equipmentName = params.equipmentName;
    this.registeredByUserId = params.registeredByUserId;
    this.registeredAt = params.registeredAt;
  }
}

/**
 * Staff member who took part in a product batch.
 *
 * @remarks
 * Name and role are a snapshot of the ones registered at that time.
 *
 * @example
 * ```typescript
 * const participation = new StaffParticipation({
 *   id: 1,
 *   batchId: 101,
 *   staffId: 9,
 *   staffName: 'Ana Torres',
 *   staffRole: 'Operator',
 *   registeredByUserId: 4,
 *   registeredAt: '2026-10-05T09:35:00Z'
 * });
 * ```
 *
 * @author Qualitrack
 */
export class StaffParticipation implements BaseEntity {
  /**
   * The unique numeric identifier of the participation record.
   */
  id: number;

  /**
   * The numeric identifier of the batch in which the person took part.
   */
  batchId: number;

  /**
   * The numeric identifier of the staff member.
   */
  staffId: number;

  /**
   * The name of the staff member when the participation was registered.
   */
  staffName: string;

  /**
   * The role of the staff member when the participation was registered; null when it had none.
   */
  staffRole: string | null;

  /**
   * The identifier of the user who registered the participation, if known.
   */
  registeredByUserId: number | null;

  /**
   * The ISO date string of the moment the participation was registered.
   */
  registeredAt: string;

  constructor(params: {
    id: number;
    batchId: number;
    staffId: number;
    staffName: string;
    staffRole: string | null;
    registeredByUserId: number | null;
    registeredAt: string;
  }) {
    this.id = params.id;
    this.batchId = params.batchId;
    this.staffId = params.staffId;
    this.staffName = params.staffName;
    this.staffRole = params.staffRole;
    this.registeredByUserId = params.registeredByUserId;
    this.registeredAt = params.registeredAt;
  }
}
