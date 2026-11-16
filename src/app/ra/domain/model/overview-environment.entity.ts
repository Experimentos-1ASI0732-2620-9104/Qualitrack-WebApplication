import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Environment of the laboratory that indicators, trends, reports and the operational overview cover.
 *
 * @remarks
 * Laboratory Management keeps the physical spaces; Reporting & Audit only keeps the reference it shows and selects
 * (Laboratory → Reporting & Audit, implemented by the backend).
 */
export class OverviewEnvironment implements BaseEntity {
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
