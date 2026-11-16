import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Deviation alert that the operational overview lists while it requires attention.
 *
 * @remarks
 * Compliance & Alerting manages the life cycle of the alert; Reporting & Audit keeps what the overview shows.
 */
export class OverviewAlert implements BaseEntity {
  id: number;

  equipmentId: number;

  parameterName: string;

  recordedValue: number;

  unit: string;

  /** `WARNING` or `CRITICAL`. */
  severity: string;

  /** `OPEN`, `ACKNOWLEDGED` or `RESOLVED`. */
  status: string;

  timestamp: string;

  constructor(params: {
    id: number;
    equipmentId: number;
    parameterName: string;
    recordedValue: number;
    unit: string;
    severity: string;
    status: string;
    timestamp: string;
  }) {
    this.id = params.id;
    this.equipmentId = params.equipmentId;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.unit = params.unit;
    this.severity = params.severity;
    this.status = params.status;
    this.timestamp = params.timestamp;
  }

  /** Whether nobody has resolved the alert yet. */
  get isOpen(): boolean {
    return this.status !== 'RESOLVED';
  }
}
