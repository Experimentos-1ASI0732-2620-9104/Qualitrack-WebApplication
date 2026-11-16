import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Laboratory shown at the top of the operational overview (dashboard).
 *
 * @remarks
 * Reporting & Audit only needs the name of the laboratory that Laboratory Management registers.
 */
export class OverviewLaboratory implements BaseEntity {
  id: number;

  name: string;

  constructor(params: { id: number; name: string }) {
    this.id = params.id;
    this.name = params.name;
  }
}
