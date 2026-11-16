import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Device where an alert originated, named in the alert lists and detail.
 *
 * @remarks
 * Equipment Management is the owner of the device; Compliance & Alerting only keeps its name to show the origin of
 * each alert (the backend reads it through `CaExternalEquipmentService`).
 */
export class AlertDevice implements BaseEntity {
  id: number;

  name: string;

  constructor(params: { id: number; name: string }) {
    this.id = params.id;
    this.name = params.name;
  }
}
