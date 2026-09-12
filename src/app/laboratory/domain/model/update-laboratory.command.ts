/**
 * Represents the command payload for updating the profile information
 * of an existing laboratory within the Laboratory domain.
 *
 * @remarks
 * In Command Query Responsibility Segregation (CQRS), a command encapsulates
 * the intent to perform a state-changing operation. This command carries the
 * set of mutable fields that are allowed to be updated on an existing
 * {@link Laboratory} entity.
 *
 * This interface is intended to be used as the input contract for the
 * corresponding use case or application service responsible for laboratory
 * profile updates. It deliberately excludes immutable or system-managed fields
 * such as `id`, `ruc`, or `createdAt`, as those must not be modified after
 * the laboratory has been registered.
 *
 * @example
 * ```typescript
 * const command: UpdateLaboratoryCommand = {
 *   name: 'BioLab Peru S.A.C.',
 *   address: 'Av. Industrial 789, Lima',
 *   phone: '+51 1 987-6543',
 *   applicableRegulations: ['ISO 17025', 'DIGEMID', 'GMP'],
 * };
 * ```
 */
export interface UpdateLaboratoryCommand {
  /**
   * The updated official registered name of the laboratory.
   *
   * @remarks
   * May need to be updated to reflect legal name changes resulting from
   * corporate restructuring or rebranding. The use case layer should
   * ensure this value remains consistent with official regulatory records.
   */
  name: string;

  /**
   * The updated physical address of the laboratory.
   *
   * @remarks
   * Should be updated whenever the laboratory relocates or its address
   * details change. Accuracy is important as this information may appear
   * on regulatory submissions and official correspondence.
   */
  address: string;

  /**
   * The updated contact phone number of the laboratory.
   *
   * @remarks
   * Used as the primary contact reference for regulatory bodies, suppliers,
   * and clients. Should be kept current to ensure uninterrupted communication
   * in audit or emergency situations.
   */
  phone: string;

  /**
   * The updated list of regulatory frameworks or standards applicable
   * to this laboratory.
   *
   * @remarks
   * This field replaces the existing set of regulations entirely upon update.
   * The use case layer should treat this as a full replacement rather than
   * a partial merge, ensuring that removed regulations are no longer associated
   * with the laboratory. Examples of valid entries include `'ISO 17025'`,
   * `'DIGEMID'`, or `'GMP'`.
   */
  applicableRegulations: string[];
}
