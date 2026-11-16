import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Person of the laboratory that an alert can name as who attended or resolved it.
 *
 * @remarks
 * Alerts only keep the account of the person, so Compliance & Alerts keeps this reference to show who it was
 * (Laboratory and IAM → Compliance & Alerts, implemented by the backend).
 */
export class AlertPerson implements BaseEntity {
  /** Account the person signs in with, the one alerts refer to. */
  id: number;

  /** Full name of the person, or their username when the laboratory does not know their name. */
  name: string;

  constructor(params: { id: number; name: string }) {
    this.id = params.id;
    this.name = params.name;
  }
}
