/**
 * Command for creating a new laboratory.
 *
 * @remarks
 * In CQRS, this command represents the intent to register a new laboratory
 * in the system. It carries the business data required by the creation use case,
 * excluding system-generated fields such as `id`, `createdAt`, and `updatedAt`.
 *
 * Unlike update operations, this command includes the laboratory tax identifier
 * (`ruc`) because it is required when the laboratory is first registered.
 *
 * @example
 * ```typescript
 * const command: CreateLaboratoryCommand = {
 *   name: 'BioLab Peru S.A.C.',
 *   ruc: '20512345678',
 *   address: 'Av. Industrial 456, Lima',
 *   phone: '+51 1 234-5678',
 *   applicableRegulations: ['ISO 17025', 'DIGEMID']
 * };
 * ```
 */
export interface CreateLaboratoryCommand {
  /**
   * The official registered name of the laboratory.
   */
  name: string;

  /**
   * The tax identification number of the laboratory.
   *
   * @remarks
   * In Peru, this corresponds to the RUC used to identify legal entities.
   */
  ruc: string;

  /**
   * The physical address of the laboratory.
   */
  address: string;

  /**
   * The contact phone number of the laboratory.
   */
  phone: string;

  /**
   * The regulatory frameworks or standards applicable to this laboratory.
   */
  applicableRegulations: string[];
}
