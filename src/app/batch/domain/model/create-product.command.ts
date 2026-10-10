/**
 * Intent to register a pharmaceutical product in the environment taken from the route.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this Command belongs to the application layer. It
 * encapsulates the data needed to register a product, acting as a strict boundary contract for the use case.
 * Only the QA Manager (and the Admin, who has the same quality permissions) can register products.
 *
 * @example
 * ```typescript
 * const command: CreateProductCommand = {
 *   code: 'PRD-001',
 *   name: 'Paracetamol 500 mg',
 *   description: 'Analgesic tablets',
 *   specifications: 'Film-coated tablets, 500 mg per unit.'
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface CreateProductCommand {
  /**
   * Internal catalog code, unique in the laboratory (maximum 50 characters).
   */
  code: string;

  /**
   * Product name, unique in the laboratory (maximum 150 characters).
   */
  name: string;

  /**
   * Optional description (maximum 500 characters).
   */
  description: string | null;

  /**
   * Technical specifications (maximum 1000 characters).
   */
  specifications: string;
}
