import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Environment of the laboratory whose alerts and deviations Compliance & Alerts shows.
 *
 * @remarks
 * Laboratory Management keeps the physical spaces; Compliance & Alerts only keeps the reference it shows and selects
 * (Laboratory → Compliance & Alerts, implemented by the backend).
 */
export class AlertEnvironment implements BaseEntity {
  id: number;

  code: string;

  name: string;

  /** Usage assigned by Laboratory Management, such as `RAW_MATERIAL_STORAGE`; null when it has none. */
  usage: string | null;

  constructor(params: { id: number; code: string; name: string; usage: string | null }) {
    this.id = params.id;
    this.code = params.code;
    this.name = params.name;
    this.usage = params.usage;
  }
}
