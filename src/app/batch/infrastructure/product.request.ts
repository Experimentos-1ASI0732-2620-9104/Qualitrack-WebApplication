/**
 * Body of POST /laboratories/{laboratoryId}/environments/{environmentId}/products.
 *
 * @remarks
 * Infrastructure-level contract sent to the API to register a pharmaceutical product. Only the QA Manager
 * can register products.
 *
 * @example
 * ```typescript
 * const request: CreateProductRequest = {
 *   code: 'PRD-001',
 *   name: 'Paracetamol 500 mg',
 *   description: null,
 *   specifications: 'Film-coated tablets, 500 mg per unit.'
 * };
 * ```
 *
 * @author Qualitrack
 */
export interface CreateProductRequest {
  /**
   * Internal catalog code, unique in the laboratory.
   */
  code: string;

  /**
   * Product name, unique in the laboratory.
   */
  name: string;

  /**
   * Optional description of the product.
   */
  description: string | null;

  /**
   * Technical specifications of the product.
   */
  specifications: string;
}
